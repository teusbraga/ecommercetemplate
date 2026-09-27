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

  // 1. grava o evento (mesmo se inválido, para auditoria)
  await supabase.from('payment_events').insert({
    provider: providerName,
    event_type: event.eventType,
    provider_event_id: event.providerEventId,
    payload: event.raw as any,
    signature_valid: valid,
  });

  if (!valid) return NextResponse.json({ ok: false }, { status: 401 });

  // 2. atualiza o payment correspondente
  await supabase.from('payments')
    .update({ status: event.status, paid_at: event.paidAt?.toISOString() ?? null })
    .eq('provider', providerName)
    .eq('provider_payment_id', event.providerPaymentId);

  // 3. marca como processado
  await supabase.from('payment_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('provider', providerName)
    .eq('provider_event_id', event.providerEventId);

  return NextResponse.json({ ok: true });
}