-- ============ EXTENSÕES ============
create extension if not exists "pgcrypto";

-- ============ ENUMS ============
create type user_role as enum ('customer','staff','admin','auditor');
create type order_status as enum ('draft','pending','paid','processing','shipped','delivered','cancelled','refunded');
create type payment_status as enum ('pending','processing','paid','failed','refunded','cancelled','expired');
create type payment_provider as enum ('stripe','openpix','asaas','ifthenpay','mercadopago','pagbank','manual');
create type payment_method as enum ('pix','credit_card','debit_card','boleto','mbway','multibanco','cash');
create type inventory_movement_type as enum ('in','out','adjustment','reservation','release','sale','return');
create type cash_movement_type as enum ('in','out','sangria','suprimento','adjustment');
create type cash_register_status as enum ('open','closed');

-- ============ USUÁRIOS (espelha auth.users) ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  document text, -- CPF/CNPJ (BR) ou NIF (PT)
  role user_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  street text not null,
  number text,
  complement text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null default 'BR',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.addresses(user_id);

-- ============ CATÁLOGO ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  sku text unique not null,
  name text not null,
  slug text unique not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),
  currency text not null default 'BRL',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products(category_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique not null,
  name text not null, -- ex: "P / Azul"
  price_cents integer not null check (price_cents >= 0),
  attributes jsonb not null default '{}'::jsonb, -- {size:'P', color:'Azul'}
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.product_variants(product_id);

-- ============ ESTOQUE (com trilha de auditoria) ============
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid unique not null references public.product_variants(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold integer not null default 5,
  updated_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  type inventory_movement_type not null,
  quantity integer not null, -- delta (positivo ou negativo)
  previous_quantity integer not null,
  new_quantity integer not null,
  reason text,
  reference_type text, -- 'order', 'manual', 'return'
  reference_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.inventory_movements(variant_id, created_at desc);

-- ============ CARRINHO ============
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_token text unique, -- para carrinho de visitante
  status text not null default 'active', -- active | converted | abandoned
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null, -- snapshot no momento da adição
  created_at timestamptz not null default now(),
  unique(cart_id, variant_id)
);

-- ============ VENDAS ============
create sequence if not exists order_number_seq start 1000;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null default nextval('order_number_seq') unique,
  user_id uuid references public.profiles(id) on delete set null,
  status order_status not null default 'pending',
  currency text not null default 'BRL',
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  shipping_address jsonb,
  billing_address jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders(user_id, created_at desc);
create index on public.orders(status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  -- snapshots (histórico imutável)
  product_name text not null,
  variant_name text,
  sku text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null,
  total_cents integer not null,
  created_at timestamptz not null default now()
);
create index on public.order_items(order_id);

-- ============ PAGAMENTOS (multi-provider) ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider payment_provider not null,
  method payment_method not null,
  status payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'BRL',
  provider_payment_id text,     -- ID no provedor
  provider_reference text,      -- txid do Pix, charge_id, etc
  idempotency_key text unique,  -- evita duplicação
  provider_payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.payments(order_id);
create index on public.payments(provider, provider_payment_id);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider payment_provider not null,
  event_type text not null,
  provider_event_id text,
  payload jsonb not null,
  signature_valid boolean not null default false,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);

-- ============ CAIXA INTERNO ============
create table public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references public.profiles(id) on delete restrict,
  closed_by uuid references public.profiles(id) on delete restrict,
  status cash_register_status not null default 'open',
  opening_amount_cents integer not null default 0,
  closing_amount_cents integer,
  expected_amount_cents integer, -- calculado
  difference_cents integer,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  notes text
);

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_register_id uuid not null references public.cash_registers(id) on delete cascade,
  type cash_movement_type not null,
  amount_cents integer not null check (amount_cents > 0),
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.cash_movements(cash_register_id, created_at desc);

-- ============ AUDITORIA GERAL ============
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,          -- 'order.created', 'payment.paid', etc
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index on public.audit_logs(entity_type, entity_id, created_at desc);

-- ============ TRIGGERS: updated_at ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','products','carts','orders','payments','inventory_items']
  loop
    execute format(
      'create trigger trg_touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ============ TRIGGER: novo usuário → profile ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ RLS ESSENCIAL ============
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.audit_logs enable row level security;

-- helper: é admin?
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','staff'));
$$;

-- profile: usuário vê o seu, admin vê todos
create policy "profile self read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profile self update" on public.profiles
  for update using (auth.uid() = id);

-- orders: dono ou admin
create policy "orders owner" on public.orders
  for all using (auth.uid() = user_id or public.is_admin());

create policy "order_items via order" on public.order_items
  for all using (
    exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );

-- payments: leitura pelo dono do pedido
create policy "payments owner read" on public.payments
  for select using (
    exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );

-- produtos: leitura pública se ativo
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
create policy "products public read" on public.products
  for select using (is_active or public.is_admin());
create policy "variants public read" on public.product_variants
  for select using (is_active or public.is_admin());