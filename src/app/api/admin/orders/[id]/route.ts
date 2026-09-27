import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Atualiza status do pedido
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('id, status, order_number')
      .single();

    if (error || !order) {
      throw error || new Error('Pedido não encontrado.');
    }

    // 2. Se cancelado, libera reservas de estoque
    if (status === 'cancelled') {
      const { data: items } = await supabase
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', id);

      if (items) {
        for (const item of items) {
          if (item.variant_id) {
            await supabase.rpc('release_stock', {
              p_variant_id: item.variant_id,
              p_quantity: item.quantity,
              p_order_id: id,
            });
          }
        }
      }
    }

    // 3. Auditoria
    await supabase.from('audit_logs').insert({
      action: `order.status_updated_to_${status}`,
      entity_type: 'orders',
      entity_id: id,
      after: { status },
    });

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
