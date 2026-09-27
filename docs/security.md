# 🛡️ Política de Segurança e Integridade Financeira (Cadeia de Custódia)

Este documento descreve os mecanismos de defesa e auditoria implementados no **eCommerce Template** para impedir fraudes, vazamentos ou adulteração manual de pagamentos.

---

## 1. O Problema da Confiança Cega

Em sistemas ingênuos de e-commerce, o status de um pedido é frequentemente determinado por uma simples coluna de banco de dados (`payments.status = 'paid'`).
Isso cria um vetor grave de vulnerabilidade:
* Se um funcionário mal-intencionado, atacante com credenciais vazadas ou invasor alterar a linha no banco, o sistema poderia liberar a mercadoria para expedição sem que o dinheiro tenha entrado na conta bancária do lojista.

---

## 2. A Solução em 4 Camadas de Defesa

```
[ Provedor Bancário (OpenPix/Stripe) ]
                │
         1. Webhook HMAC
                ▼
      [ payment_events ] ──(Assinatura Válida?)──► [ payments ]
                │                                       │
                │                               2. Database Trigger
                │                             (Bloqueia UPDATE manual)
                ▼                                       │
     [ Liberação de Envio ] ◄───────────────────────────┘
                │
       3. Double-Check API
  (Consulta ativa reversa ao banco)
```

### Camada 1: Assinatura Criptográfica HMAC Obrigatória
* Todo webhook recebido em `/api/webhooks/[provider]` é verificado via HMAC com segredo criptográfico compartilhado (`x-webhook-signature`).
* O payload bruto é persistido em `public.payment_events` com flag `signature_valid`.
* Webhooks com assinatura inválida são rejeitados com `401 Unauthorized` e registrados para auditoria de segurança.

### Camada 2: Trigger de Proteção no PostgreSQL (`0003_payment_security_trap.sql`)
* Criada a trigger `trg_protect_payment_status` na tabela `public.payments`.
* **Regra:** Se qualquer comando tentar alterar `status` para `'paid'`, o banco de dados consulta obrigatoriamente se existe um evento em `payment_events` com `signature_valid = true`.
* Caso contrário, a transação é abortada com erro e um registro de violação é salvo em `public.audit_logs` (`security.unauthorized_payment_tamper_attempt`).

### Camada 3: Verificação Reversa Ativa (Double-Check de API)
* Disponibilizado o endpoint `/api/admin/orders/[id]/verify`.
* Antes de despachar mercadorias de alto valor, o administrador ou um job automatizado pode acionar o **Double-Check**:
  * O servidor faz uma requisição HTTP direta à API da instituição financeira buscando a cobrança (`provider.getPayment(provider_payment_id)`).
  * Se o banco emissor responder que a cobrança ainda está pendente ou não existe, o sistema:
    1. Cancela o pedido imediatamente.
    2. Reverte o status do pagamento para `failed`.
    3. Registra incidente de segurança em `audit_logs` (`security.fraud_detected_payment_mismatch`).

### Camada 4: Princípio do Menor Privilégio no Supabase (RLS & Service Role)
* A tabela `payments` possui RLS restrito: usuários comuns só possuem permissão de leitura (`SELECT`) sobre pagamentos associados aos seus próprios pedidos.
* Apenas o backend oficial (via `service_role` protegida) possui permissão de escrita, mitigando ataques pelo cliente.
