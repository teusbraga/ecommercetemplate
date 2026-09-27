import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, document, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ users: users ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, role, is_active } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 });
    }

    const validRoles = ['customer', 'staff', 'admin', 'auditor'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: `Papel inválido. Opções: ${validRoles.join(', ')}` }, { status: 400 });
    }

    const supabase = createServiceClient();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (role !== undefined) updatePayload.role = role;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, email, full_name, role, is_active')
      .single();

    if (error) throw error;

    // Registra alteração de privilégio em auditoria
    await supabase.from('audit_logs').insert({
      action: 'user.permission_changed',
      entity_type: 'profiles',
      entity_id: userId,
      after: updatePayload,
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
