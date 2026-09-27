import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { variant_id, delta, type = 'adjustment', reason } = await req.json();

    if (!variant_id || delta === undefined) {
      return NextResponse.json(
        { error: 'ID da variante e delta de estoque são obrigatórios.' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Executa a RPC transacional adjust_stock
    const { data, error } = await supabase.rpc('adjust_stock', {
      p_variant_id: variant_id,
      p_delta: Number(delta),
      p_type: type,
      p_reason: reason ?? 'Ajuste manual administrativo',
      p_reference_type: 'manual',
    });

    if (error) {
      console.error('Erro na RPC adjust_stock:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, item: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
