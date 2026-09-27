-- ============ SEGURANÇA E AUDITORIA FINANCEIRA ============
-- Impede alteração direta e manual de pagamentos para 'paid' sem evento de webhook assinado

-- 1. Função Trigger: Valida se a transição para 'paid' possui evento criptográfico registrado
create or replace function public.protect_payment_status_transition()
returns trigger language plpgsql security definer as $$
declare
  v_has_valid_event boolean;
begin
  -- Se o status anterior não era 'paid' e está tentando virar 'paid':
  if (old.status is distinct from new.status and new.status = 'paid') then
    
    -- Permite se for método manual/dinheiro físico registrado no balcão
    if (new.provider = 'manual') then
      return new;
    end if;

    -- Em modo sandbox/demo, permite se a chave de provider começar com demo_
    if (new.provider_payment_id like 'demo_%') then
      return new;
    end if;

    -- REGRA DE PRODUÇÃO: Deve existir um evento em payment_events com assinatura HMAC válida
    select exists(
      select 1 from public.payment_events pe
      where pe.provider = new.provider
        and (pe.provider_event_id = new.provider_payment_id or pe.payment_id = new.id)
        and pe.signature_valid = true
    ) into v_has_valid_event;

    if not v_has_valid_event then
      -- Grava tentativa suspeita em audit_logs antes de abortar
      insert into public.audit_logs (
        action, entity_type, entity_id, before, after
      ) values (
        'security.unauthorized_payment_tamper_attempt',
        'payments',
        new.id,
        jsonb_build_object('status', old.status),
        jsonb_build_object('attempted_status', new.status, 'provider', new.provider)
      );

      raise exception 'SEGURANÇA: Alteração direta de status para pago bloqueada. É obrigatório um webhook assinado (HMAC) do provedor de pagamento.';
    end if;
  end if;

  return new;
end;
$$;

-- 2. Trigger ativo na tabela payments
drop trigger if exists trg_protect_payment_status on public.payments;
create trigger trg_protect_payment_status
before update on public.payments
for each row execute function public.protect_payment_status_transition();
