import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const supabase = createServiceClient();

    if (orderId.startsWith('demo_ord_')) {
      return NextResponse.json({
        orderId,
        orderNumber: 1234,
        status: 'pending',
        paymentStatus: 'pending',
        paidAt: null,
      });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, status, total_cents')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('status, paid_at, provider')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: payment?.status ?? 'pending',
      paidAt: payment?.paid_at ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
