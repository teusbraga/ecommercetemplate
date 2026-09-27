🛒 # E-commerce Base — Template Replicável
Esqueleto de e-commerce multi-provider de pagamentos, feito para replicar entre clientes (Brasil e Portugal) com o mínimo de retrabalho.

🧱 Stack
Next.js (App Router) + TypeScript

Supabase (Postgres + Auth + RLS)

Vercel (deploy) + GitHub (Template Repository)

Playwright + Selenium (testes E2E)

📁 Estrutura

src/
├── app/
│   ├── (shop)/          # catálogo, carrinho, checkout
│   ├── (admin)/         # dashboard, produtos, pedidos, estoque, caixa
│   └── api/webhooks/[provider]/route.ts
├── components/ui/       # Modal, Button, Input, Table
├── lib/
│   ├── supabase/        # client + server
│   ├── payments/        # abstração multi-provider
│   ├── inventory.ts     # movimentações auditáveis
│   ├── cash.ts          # caixa interno
│   └── audit.ts         # log de ações
└── types/database.ts
supabase/migrations/     # schema versionado
tests/{e2e,selenium}/

💳 Pagamentos

Camada de abstração em src/lib/payments/ com contrato único (PaymentProviderAdapter). Providers suportados:

stripe · openpix · asaas · ifthenpay · mercadopago · manual

Trocar de provider = trocar uma linha. Webhooks validados por assinatura e gravados em payment_events (mesmo os inválidos, para auditoria).

🗄️ Banco (destaques)
Snapshots em order_items — histórico imutável

inventory_movements com previous_quantity/new_quantity — trilha completa

idempotency_key em payments — evita cobrança dupla

cash_registers + cash_movements — sessões de caixa auditáveis

audit_logs — toda ação crítica registrada

RLS habilitado: cliente vê o seu, admin vê tudo

🚀 Setup

# 1. Instalar
npm install

# 2. Variáveis (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 3. Banco
supabase start
supabase db reset

# 4. Tipos
supabase gen types typescript --local > src/types/database.ts

# 5. Dev
npm run dev

🧪 Testes
bash
npm run test:e2e          # Playwright
npm run test:selenium     # Selenium (Node)
Convenção: todo elemento interativo tem data-testid. A mesma suíte roda nos dois runners.

🔁 Replicação para novo cliente
Use este repositório como Template no GitHub → "Use this template"

Crie um novo projeto no Supabase e cole as migrations

Configure chaves no Vercel (variáveis de ambiente)

Ajuste tema/identidade visual e providers ativos

Deploy

🔒 Segurança
Chaves secretas só no backend (env vars)

Webhooks sempre verificados por assinatura HMAC

RLS ativo em todas as tabelas sensíveis

service_role só em route handlers/server actions

📌 Status
☑ Schema Postgres normalizado
☑ Camada de pagamentos abstrata
☑ Estrutura Next.js (shop + admin)
☑ Setup de testes
□ Provider OpenPix completo
□ Provider Asaas completo
□ Provider Ifthenpay completo
□ Provider Stripe completo
□ RPCs de estoque e caixa
□ GitHub Actions (CI)
📝 Licença
Uso interno / a definir por projeto.

