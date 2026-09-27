import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const supabase = createServiceClient();

    // 1. Abrir Caixa
    if (action === 'open') {
      const { opening_amount_cents, notes } = body;

      // Garante que não haja outro caixa aberto
      const { data: existing } = await supabase
        .from('cash_registers')
        .select('id')
        .eq('status', 'open')
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'Já existe uma sessão de caixa aberta no momento.' },
          { status: 400 }
        );
      }

      // Busca perfil admin/staff padrão
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'staff'])
        .limit(1);

      const userId = profiles?.[0]?.id;

      if (!userId) {
        return NextResponse.json(
          { error: 'Nenhum usuário com papel de admin/staff encontrado.' },
          { status: 400 }
        );
      }

      const { data: register, error } = await supabase
        .from('cash_registers')
        .insert({
          opened_by: userId,
          status: 'open',
          opening_amount_cents: Number(opening_amount_cents || 0),
          notes: notes ?? null,
        })
        .select('*')
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'cash_register.opened',
        entity_type: 'cash_registers',
        entity_id: register.id,
        after: { opening_amount_cents },
      });

      return NextResponse.json({ success: true, register });
    }

    // 2. Registrar Movimento (Sangria / Suprimento / Ajuste)
    if (action === 'movement') {
      const { cash_register_id, type, amount_cents, reason } = body;

      if (!cash_register_id || !type || !amount_cents) {
        return NextResponse.json(
          { error: 'ID do caixa, tipo e valor são obrigatórios.' },
          { status: 400 }
        );
      }

      const { data: movement, error } = await supabase
        .from('cash_movements')
        .insert({
          cash_register_id,
          type,
          amount_cents: Number(amount_cents),
          reason: reason ?? null,
          reference_type: 'manual',
        })
        .select('*')
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, movement });
    }

    // 3. Fechar Caixa (utilizando a RPC close_cash_register para cálculo atômico da diferença)
    if (action === 'close') {
      const { cash_register_id, counted_amount_cents, notes } = body;

      if (!cash_register_id || counted_amount_cents === undefined) {
        return NextResponse.json(
          { error: 'ID do caixa e valor contado são obrigatórios.' },
          { status: 400 }
        );
      }

      const { data: closedRegister, error } = await supabase.rpc('close_cash_register', {
        p_register_id: cash_register_id,
        p_counted_amount_cents: Number(counted_amount_cents),
        p_notes: notes ?? 'Fechamento de caixa',
      });

      if (error) {
        console.error('Erro ao fechar caixa:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await supabase.from('audit_logs').insert({
        action: 'cash_register.closed',
        entity_type: 'cash_registers',
        entity_id: cash_register_id,
        after: closedRegister,
      });

      return NextResponse.json({ success: true, register: closedRegister });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
