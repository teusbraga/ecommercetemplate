🛒 # E-commerce Base — Template Replicável

Esqueleto de e-commerce multi-provider de pagamentos, construído com Next.js 15, TypeScript e Supabase. Projetado para ser replicado entre múltiplos clientes (Brasil e Portugal) com zero retrabalho de arquitetura e com sincronização automática do banco de dados via GitHub.

---

## 🧱 Stack

* **Frontend & Backend**: Next.js 15 (App Router) + React 19 + TypeScript
* **Banco de Dados & Autenticação**: Supabase (PostgreSQL 15+, Auth SSR, RLS, Functions & Triggers)
* **Deploy & CI/CD**: Vercel + GitHub (Template Repository) + Supabase GitHub Integration
* **Testes E2E Automatizados**: Playwright (suíte completa) + Selenium WebDriver

---

## 📁 Estrutura do Projeto

```text
src/
├── app/
│   ├── (shop)/                  # Loja: Catálogo, Página do Produto, Carrinho, Checkout Pix, Conta e Login
│   ├── (admin)/                 # Painel Admin: Dashboard, Produtos, Pedidos, Estoque, Sessões de Caixa e Gestão de Usuários
│   ├── api/
│   │   ├── admin/               # Endpoints protegidos para operações administrativas (estoque, produtos, caixa, permissões)
│   │   ├── checkout/            # Criação de pedidos e emissão de cobranças
│   │   ├── orders/              # Consulta de status e polling de pagamentos
│   │   └── webhooks/[provider]/ # Recebimento idempotente e verificação de assinatura de gateways
│   └── auth/callback/           # OAuth callback (Google e email/senha)
├── components/ui/               # Modal, Button, Input, Table com data-testid padronizados
├── lib/
│   ├── supabase/                # Clients para Client Components, Server Components e Admin (Service Role)
│   ├── payments/                # Contrato único (PaymentProviderAdapter) e implementações (OpenPix, Stripe, etc.)
│   ├── inventory.ts             # Funções de movimentação de estoque auditáveis
│   ├── cash.ts                  # Gestão de sessões e movimentações de caixa
│   └── audit.ts                 # Trilha de auditoria em audit_logs
└── types/database.ts            # Tipagem do banco
supabase/
└── migrations/                  # Schema versionado (0001_init.sql, 0002_rpcs_and_security.sql)
tests/
├── e2e/                         # Testes Playwright (loja, checkout, admin, auth, integridade)
└── selenium/                    # Testes de compatibilidade com Selenium WebDriver
```

---

## 💳 Camada de Pagamentos Multi-Provider

Abstração centralizada em `src/lib/payments/` com interface unificada:
* **Providers implementados e prontos**: `openpix`, `stripe`, `asaas`, `ifthenpay`, `mercadopago`, `manual`.
* **Troca transparente**: basta alterar a variável de configuração para alternar entre provedores BR e PT.
* **Segurança e Auditoria**:
  * Assinaturas de Webhook HMAC validadas rigorosamente.
  * Todas as chamadas de webhook são salvas na tabela `payment_events` (inclusive requisições rejeitadas, para auditoria).
  * Pagamentos usam `idempotency_key` para blindar contra cobranças duplicadas.

---

## 🗄️ Arquitetura do Banco de Dados & Segurança

* **Isolamento via RLS (Row Level Security)**: Clientes visualizam apenas seus próprios pedidos; usuários com role `admin` têm acesso irrestrito às áreas de gestão.
* **Snapshots de Pedidos**: `order_items` armazena nome, preço e dados no momento da compra, tornando o histórico imutável mesmo se o catálogo mudar.
* **Estoque e Caixa Transacionais**:
  * RPCs atômicas (`record_inventory_movement`, `open_cash_register`, `close_cash_register`).
  * `inventory_movements` com `previous_quantity` e `new_quantity` para rastreabilidade completa.
* **Trilha de Auditoria**: Tabela `audit_logs` que registra ator, ação e timestamp de eventos críticos do sistema.

---

## 🔄 Como Replicar para um Novo Cliente (Passo a Passo com Zero Config Manual)

Ao criar uma nova loja a partir deste template, siga este guia:

### 1. Criar Repositório no GitHub
* No GitHub, clique em **Use this template** > **Create a new repository** (ou faça um Fork).
* Clone o repositório em sua máquina.

### 2. Criar o Projeto no Supabase
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/projects) e clique em **New Project**.
2. Defina o nome do cliente e a região mais próxima.

### 3. Conectar Supabase ao GitHub (Migrações 100% Automáticas)
1. No painel do seu projeto no Supabase, vá em **Project Settings** > **Integrations** > **GitHub**.
2. Conecte sua conta do GitHub e selecione o repositório criado.
3. Ative a integração com a branch `main`.
4. **Para rodar a primeira migração na hora**:
   Execute um push inicial na branch `main`:
   ```bash
   git commit --allow-empty -m "chore: initial supabase migration trigger"
   git push origin main
   ```
   *O Supabase lerá automaticamente todos os arquivos da pasta `supabase/migrations/` e construirá as tabelas, índices, triggers e funções no banco.*

### 4. Configurar Variáveis de Ambiente
Copie `.env.local.example` para `.env.local`:
```bash
cp .env.local.example .env.local
```
No painel do Supabase (**Project Settings** > **API**), copie as chaves:
```env
NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 5. Instalar e Rodar Localmente
```bash
npm install
npm run dev
```

---

## 🧪 Testes Automatizados

O repositório possui suíte de testes ponta a ponta cobrindo catálogo, carrinho, checkout, login e painel administrativo:

```bash
# Executar todos os testes E2E com Playwright
npm run test:e2e

# Executar testes Selenium
npm run test:selenium
```

> **Convenção**: Todos os botões, campos de entrada, modais e tabelas contêm atributos `data-testid` padronizados para garantir testes resilientes a mudanças visuais de CSS/tema.

---

## 📌 Status das Funcionalidades

- [x] Schema PostgreSQL normalizado com RLS
- [x] Sincronização e deploys de migrações automáticas via Supabase + GitHub
- [x] Autenticação SSR (Google OAuth + Email/Senha) e controle de roles (`admin`/`customer`)
- [x] Loja pública completa: catálogo, página do produto, carrinho persistente e checkout Pix
- [x] Painel Administrativo completo: Dashboard, Produtos, Pedidos, Estoque, Caixa e Permissões de Usuários
- [x] Camada multi-provider de pagamentos e webhooks idempotentes
- [x] RPCs de estoque e controle financeiro de caixa com auditoria
- [x] Suíte de testes automatizados E2E (Playwright & Selenium)
