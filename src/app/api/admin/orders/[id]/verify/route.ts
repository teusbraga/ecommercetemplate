import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments';
import type { PaymentProviderName } from '@/lib/payments/types';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const supabase = createServiceClient();

    // 1. Busca pedido e pagamento correspondente
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_number, status, total_cents')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (payErr || !payment) {
      return NextResponse.json({ error: 'Nenhum pagamento associado a este pedido.' }, { status: 404 });
    }

    // Se for modo demo/sandbox
    if (payment.provider_payment_id?.startsWith('demo_')) {
      return NextResponse.json({
        verified: true,
        mode: 'sandbox',
        status: payment.status,
        message: 'Modo demonstração/sandbox: pagamento simulado.',
      });
    }

    // 2. Consulta Ativa (Double-check) direto na API do provedor (OpenPix, Stripe, Asaas, etc)
    const provider = getPaymentProvider(payment.provider as PaymentProviderName);
    const bankVerification = await provider.getPayment(payment.provider_payment_id);

    // 3. Validação cruzada: o banco confirma que foi liquidado?
    const isActuallyPaidInBank = bankVerification.status === 'paid';

    if (payment.status === 'paid' && !isActuallyPaidInBank) {
      // ALERTA DE FRAUDE: o banco do sistema dizia 'paid', mas a instituição financeira nega!
      await supabase.from('audit_logs').insert({
        action: 'security.fraud_detected_payment_mismatch',
        entity_type: 'orders',
        entity_id: orderId,
        before: { status: order.status, payment_status: payment.status },
        after: {
          bank_status: bankVerification.status,
          alert: 'Tentativa de adulteração detectada via double-check da API bancária!',
        },
      });

      // Bloqueia e cancela pedido
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      return NextResponse.json({
        verified: false,
        fraudDetected: true,
        message: 'ALERTA DE FRAUDE: Pagamento não consta como liquidado no provedor oficial!',
      }, { status: 400 });
    }

    // Se o banco confirmou e o sistema ainda estava pendente, atualiza com segurança
    if (isActuallyPaidInBank && payment.status !== 'paid') {
      await supabase
        .from('payments')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', payment.id);

      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      await supabase.rpc('commit_order_stock', { p_order_id: orderId });
    }

    return NextResponse.json({
      verified: true,
      bankStatus: bankVerification.status,
      systemStatus: payment.status,
      liquidated: isActuallyPaidInBank,
    });
  } catch (err: any) {
    console.error('Erro na verificação cruzada de pagamento:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
