import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, sku, slug, description, price_cents, cost_cents, initial_stock } = body;

    if (!name || !sku || !slug || price_cents === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: Nome, SKU, Slug e Preço.' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Cria o produto
    const { data: product, error: prodError } = await supabase
      .from('products')
      .insert({
        name,
        sku,
        slug,
        description: description ?? null,
        price_cents: Number(price_cents),
        cost_cents: Number(cost_cents || 0),
        currency: 'BRL',
        is_active: true,
      })
      .select('id, name, slug')
      .single();

    if (prodError || !product) {
      console.error('Erro ao criar produto:', prodError);
      return NextResponse.json(
        { error: prodError?.message ?? 'Falha ao criar produto.' },
        { status: 500 }
      );
    }

    // 2. Cria a variante padrão
    const { data: variant, error: varError } = await supabase
      .from('product_variants')
      .insert({
        product_id: product.id,
        sku: `${sku}-DEFAULT`,
        name: 'Padrão',
        price_cents: Number(price_cents),
        is_active: true,
      })
      .select('id')
      .single();

    if (varError || !variant) {
      console.error('Erro ao criar variante padrão:', varError);
    } else if (initial_stock && Number(initial_stock) > 0) {
      // 3. Registra estoque inicial via RPC adjust_stock
      await supabase
        .from('inventory_items')
        .insert({
          variant_id: variant.id,
          quantity: Number(initial_stock),
          reserved_quantity: 0,
          low_stock_threshold: 5,
        });

      await supabase.from('inventory_movements').insert({
        variant_id: variant.id,
        type: 'in',
        quantity: Number(initial_stock),
        previous_quantity: 0,
        new_quantity: Number(initial_stock),
        reason: 'Estoque inicial de cadastro',
        reference_type: 'manual',
      });
    }

    // 4. Log de auditoria
    await supabase.from('audit_logs').insert({
      action: 'product.created',
      entity_type: 'products',
      entity_id: product.id,
      after: { name, sku, price_cents },
    });

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Toggle ativação ou atualização rápida
export async function PATCH(req: NextRequest) {
  try {
    const { id, is_active } = await req.json();
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('products')
      .update({ is_active })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
