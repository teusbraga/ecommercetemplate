-- ============ RLS COMPLEMENTARES ============

-- Auditor helper
create or replace function public.is_auditor()
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'auditor');
$$;

-- cash_registers: admin/staff gerenciam, auditor visualiza
alter table public.cash_registers enable row level security;
create policy "cash_registers admin/staff all" on public.cash_registers
  for all using (public.is_admin());
create policy "cash_registers auditor read" on public.cash_registers
  for select using (public.is_auditor());

-- cash_movements: admin/staff gerenciam, auditor visualiza
alter table public.cash_movements enable row level security;
create policy "cash_movements admin/staff all" on public.cash_movements
  for all using (public.is_admin());
create policy "cash_movements auditor read" on public.cash_movements
  for select using (public.is_auditor());

-- audit_logs: admin e auditor podem consultar; inserts via trigger/service
create policy "audit_logs read" on public.audit_logs
  for select using (public.is_admin() or public.is_auditor());

-- inventory_items: público consulta disponibilidade se produto ativo, admin gerencia
create policy "inventory_items public read" on public.inventory_items
  for select using (
    exists(
      select 1 from public.product_variants pv
      join public.products p on p.id = pv.product_id
      where pv.id = variant_id and (p.is_active or public.is_admin())
    )
  );
create policy "inventory_items admin write" on public.inventory_items
  for all using (public.is_admin());

-- inventory_movements: admin e auditor visualizam
create policy "inventory_movements read" on public.inventory_movements
  for select using (public.is_admin() or public.is_auditor());

-- carts & cart_items: dono autenticado ou anônimo com token de sessão
create policy "carts read/write" on public.carts
  for all using (
    auth.uid() = user_id or (user_id is null and session_token is not null) or public.is_admin()
  );

create policy "cart_items read/write" on public.cart_items
  for all using (
    exists(
      select 1 from public.carts c
      where c.id = cart_id and (
        c.user_id = auth.uid() or
        (c.user_id is null and c.session_token is not null) or
        public.is_admin()
      )
    )
  );

-- ============ RPCS: ESTOQUE ATÔMICO ============

-- 1. Ajuste direto de estoque (inventário, reposição, ajuste manual)
create or replace function public.adjust_stock(
  p_variant_id uuid,
  p_delta integer,
  p_type inventory_movement_type default 'adjustment',
  p_reason text default null,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_user_id uuid default null
)
returns public.inventory_items language plpgsql security definer as $$
declare
  v_item public.inventory_items;
  v_prev integer;
  v_new integer;
begin
  select * into v_item
  from public.inventory_items
  where variant_id = p_variant_id
  for update;

  if not found then
    raise exception 'Item de estoque não encontrado para a variante %', p_variant_id;
  end if;

  v_prev := v_item.quantity;
  v_new := v_prev + p_delta;

  if v_new < 0 then
    raise exception 'Estoque insuficiente para ajuste. Quantidade atual: %, delta: %', v_prev, p_delta;
  end if;

  update public.inventory_items
  set quantity = v_new, updated_at = now()
  where variant_id = p_variant_id
  returning * into v_item;

  insert into public.inventory_movements (
    variant_id, type, quantity, previous_quantity, new_quantity,
    reason, reference_type, reference_id, created_by
  ) values (
    p_variant_id, p_type, p_delta, v_prev, v_new,
    p_reason, p_reference_type, p_reference_id, coalesce(p_user_id, auth.uid())
  );

  return v_item;
end;
$$;

-- 2. Reserva de estoque durante criação de pedido
create or replace function public.reserve_stock(
  p_variant_id uuid,
  p_quantity integer,
  p_order_id uuid default null
)
returns boolean language plpgsql security definer as $$
declare
  v_item public.inventory_items;
begin
  select * into v_item
  from public.inventory_items
  where variant_id = p_variant_id
  for update;

  if not found then
    raise exception 'Item de estoque não encontrado para a variante %', p_variant_id;
  end if;

  if (v_item.quantity - v_item.reserved_quantity) < p_quantity then
    raise exception 'Estoque disponível insuficiente para reservar. Disponível: %, Solicitado: %',
      (v_item.quantity - v_item.reserved_quantity), p_quantity;
  end if;

  update public.inventory_items
  set reserved_quantity = reserved_quantity + p_quantity,
      updated_at = now()
  where variant_id = p_variant_id;

  insert into public.inventory_movements (
    variant_id, type, quantity, previous_quantity, new_quantity,
    reason, reference_type, reference_id, created_by
  ) values (
    p_variant_id, 'reservation', p_quantity, v_item.quantity, v_item.quantity,
    'Reserva de checkout', 'order', p_order_id, auth.uid()
  );

  return true;
end;
$$;

-- 3. Liberação de reserva (pedido cancelado ou expirado)
create or replace function public.release_stock(
  p_variant_id uuid,
  p_quantity integer,
  p_order_id uuid default null
)
returns boolean language plpgsql security definer as $$
declare
  v_item public.inventory_items;
begin
  select * into v_item
  from public.inventory_items
  where variant_id = p_variant_id
  for update;

  if not found then
    return false;
  end if;

  update public.inventory_items
  set reserved_quantity = greatest(0, reserved_quantity - p_quantity),
      updated_at = now()
  where variant_id = p_variant_id;

  insert into public.inventory_movements (
    variant_id, type, quantity, previous_quantity, new_quantity,
    reason, reference_type, reference_id, created_by
  ) values (
    p_variant_id, 'release', -p_quantity, v_item.quantity, v_item.quantity,
    'Liberação de reserva (pedido expirado/cancelado)', 'order', p_order_id, auth.uid()
  );

  return true;
end;
$$;

-- 4. Baixa definitiva de estoque na confirmação do pagamento
create or replace function public.commit_order_stock(
  p_order_id uuid
)
returns boolean language plpgsql security definer as $$
declare
  r record;
  v_item public.inventory_items;
  v_prev integer;
  v_new integer;
begin
  for r in (select variant_id, quantity from public.order_items where order_id = p_order_id and variant_id is not null)
  loop
    select * into v_item
    from public.inventory_items
    where variant_id = r.variant_id
    for update;

    if found then
      v_prev := v_item.quantity;
      v_new := greatest(0, v_prev - r.quantity);

      update public.inventory_items
      set quantity = v_new,
          reserved_quantity = greatest(0, reserved_quantity - r.quantity),
          updated_at = now()
      where variant_id = r.variant_id;

      insert into public.inventory_movements (
        variant_id, type, quantity, previous_quantity, new_quantity,
        reason, reference_type, reference_id, created_by
      ) values (
        r.variant_id, 'sale', -r.quantity, v_prev, v_new,
        'Venda confirmada / pagamento aprovado', 'order', p_order_id, auth.uid()
      );
    end if;
  end loop;

  return true;
end;
$$;

-- 5. Fechamento de Caixa com cálculo de diferença
create or replace function public.close_cash_register(
  p_register_id uuid,
  p_counted_amount_cents integer,
  p_closed_by uuid default null,
  p_notes text default null
)
returns public.cash_registers language plpgsql security definer as $$
declare
  v_reg public.cash_registers;
  v_mov_sum integer := 0;
  v_expected integer;
  v_diff integer;
begin
  select * into v_reg
  from public.cash_registers
  where id = p_register_id and status = 'open'
  for update;

  if not found then
    raise exception 'Caixa não encontrado ou já está fechado: %', p_register_id;
  end if;

  select coalesce(sum(
    case
      when type in ('in', 'suprimento') then amount_cents
      when type in ('out', 'sangria') then -amount_cents
      else 0
    end
  ), 0) into v_mov_sum
  from public.cash_movements
  where cash_register_id = p_register_id;

  v_expected := v_reg.opening_amount_cents + v_mov_sum;
  v_diff := p_counted_amount_cents - v_expected;

  update public.cash_registers
  set status = 'closed',
      closing_amount_cents = p_counted_amount_cents,
      expected_amount_cents = v_expected,
      difference_cents = v_diff,
      closed_by = coalesce(p_closed_by, auth.uid()),
      closed_at = now(),
      notes = coalesce(p_notes, notes)
  where id = p_register_id
  returning * into v_reg;

  return v_reg;
end;
$$;
