import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { createServiceClient } from '@/lib/supabase/server';
import type { PaymentProviderName } from '@/lib/payments/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerName } = await params;
  const provider = getPaymentProvider(providerName as PaymentProviderName);
  const raw = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  const valid = provider.verifyWebhook(raw, headers);
  const event = provider.parseWebhook(raw);

  const supabase = createServiceClient();

  // 1. Grava o evento bruto (mesmo se assinatura for inválida, para auditoria/segurança)
  await supabase.from('payment_events').insert({
    provider: providerName,
    event_type: event.eventType,
    provider_event_id: event.providerEventId,
    payload: event.raw as any,
    signature_valid: valid,
  });

  if (!valid) return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });

  // 2. Atualiza o payment correspondente e recupera o order_id
  const { data: updatedPayments } = await supabase
    .from('payments')
    .update({
      status: event.status,
      paid_at: event.paidAt?.toISOString() ?? (event.status === 'paid' ? new Date().toISOString() : null),
    })
    .eq('provider', providerName)
    .eq('provider_payment_id', event.providerPaymentId)
    .select('id, order_id, status');

  const payment = updatedPayments?.[0];

  // 3. Atualiza o ciclo do pedido e estoque com base no status do pagamento
  if (payment?.order_id) {
    if (event.status === 'paid') {
      // 3.1 Atualiza pedido para pago
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', payment.order_id);

      // 3.2 Executa baixa definitiva de estoque via RPC atômica
      await supabase.rpc('commit_order_stock', {
        p_order_id: payment.order_id,
      });

      // 3.3 Registra trilha de auditoria
      await supabase.from('audit_logs').insert({
        action: 'payment.confirmed',
        entity_type: 'orders',
        entity_id: payment.order_id,
        after: { payment_id: payment.id, provider: providerName, status: 'paid' },
      });
    } else if (['failed', 'cancelled', 'expired'].includes(event.status)) {
      // Atualiza pedido para cancelado
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', payment.order_id);

      // Libera eventuais reservas de estoque
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', payment.order_id);

      if (orderItems) {
        for (const item of orderItems) {
          if (item.variant_id) {
            await supabase.rpc('release_stock', {
              p_variant_id: item.variant_id,
              p_quantity: item.quantity,
              p_order_id: payment.order_id,
            });
          }
        }
      }

      await supabase.from('audit_logs').insert({
        action: `payment.${event.status}`,
        entity_type: 'orders',
        entity_id: payment.order_id,
        after: { payment_id: payment.id, provider: providerName, status: event.status },
      });
    }
  }

  // 4. Marca o evento do webhook como processado com sucesso
  await supabase
    .from('payment_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('provider', providerName)
    .eq('provider_event_id', event.providerEventId);

  return NextResponse.json({ ok: true });
}