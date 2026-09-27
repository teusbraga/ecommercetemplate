import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments';
import type { PaymentProviderName, PaymentMethod } from '@/lib/payments/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, shippingAddress, items, method = 'pix' } = body;

    if (!customer?.name || !customer?.email) {
      return NextResponse.json(
        { error: 'Dados do cliente incompletos (nome e email são obrigatórios).' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'O carrinho está vazio.' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Calcula valores do pedido
    const subtotalCents = items.reduce(
      (acc: number, item: any) => acc + item.priceCents * item.quantity,
      0
    );
    const shippingCents = 0; // Grátis na v1
    const totalCents = subtotalCents + shippingCents;

    let orderId = '';
    let orderNumber = Math.floor(1000 + Math.random() * 9000);

    // 2. Cria o Pedido (Order)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        status: 'pending',
        currency: 'BRL',
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        discount_cents: 0,
        total_cents: totalCents,
        shipping_address: shippingAddress ?? {},
        billing_address: shippingAddress ?? {},
      })
      .select('id, order_number')
      .single();

    if (order && !orderError) {
      orderId = order.id;
      orderNumber = Number(order.order_number);
    } else {
      console.warn('Banco de dados em modo offline/placeholder. Simulando pedido para testes e demo.');
      orderId = `demo_ord_${Date.now()}`;
    }

    // 3. Insere os itens do pedido (Order Items)
    if (order?.id) {
      const orderItemsToInsert = items.map((item: any) => ({
        order_id: orderId,
        variant_id: item.variantId ?? null,
        product_name: item.name,
        variant_name: item.variantName ?? null,
        sku: item.sku ?? `SKU-${item.id.slice(0, 8)}`,
        quantity: item.quantity,
        unit_price_cents: item.priceCents,
        total_cents: item.priceCents * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) {
        console.warn('Aviso ao inserir itens do pedido:', itemsError.message);
      }
    }

    // 4. Reserva estoque para os itens com variante
    for (const item of items) {
      if (item.variantId) {
        try {
          await supabase.rpc('reserve_stock', {
            p_variant_id: item.variantId,
            p_quantity: item.quantity,
            p_order_id: order?.id ?? null,
          });
        } catch (resErr) {
          console.warn('Aviso ao reservar estoque:', resErr);
        }
      }
    }

    // 5. Inicia o pagamento através do Provider configurado
    const providerName = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? 'openpix') as PaymentProviderName;
    const provider = getPaymentProvider(providerName);

    const paymentResult = await provider.createPayment({
      orderId,
      orderNumber,
      amountCents: totalCents,
      currency: 'BRL',
      method: method as PaymentMethod,
      customer: {
        name: customer.name,
        email: customer.email,
        document: customer.document,
        phone: customer.phone,
      },
      description: `Pedido #${orderNumber} - Loja Base`,
      idempotencyKey: `ord_${orderId}`,
    });

    // 6. Grava o registro de pagamento em payments
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order?.id ?? null,
        provider: providerName,
        method: method as PaymentMethod,
        status: paymentResult.status,
        amount_cents: totalCents,
        currency: 'BRL',
        provider_payment_id: paymentResult.providerPaymentId,
        provider_reference: paymentResult.providerReference ?? null,
        idempotency_key: `ord_${orderId}`,
        provider_payload: paymentResult.raw as any,
        expires_at: paymentResult.expiresAt ? paymentResult.expiresAt.toISOString() : null,
      })
      .select('id')
      .single();

    if (paymentError) {
      console.warn('Aviso ao salvar payment no banco:', paymentError.message);
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      paymentId: paymentRecord?.id ?? paymentResult.providerPaymentId,
      amountCents: totalCents,
      status: paymentResult.status,
      qrCode: paymentResult.qrCode,
      qrCodeImage: paymentResult.qrCodeImage,
      checkoutUrl: paymentResult.checkoutUrl,
      expiresAt: paymentResult.expiresAt,
    });
  } catch (err: any) {
    console.error('Erro no processamento do checkout:', err);
    return NextResponse.json(
      { error: err.message ?? 'Erro inesperado no checkout.' },
      { status: 500 }
    );
  }
}
