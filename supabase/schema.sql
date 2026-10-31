-- R&X Fresas con Crema: online orders.
-- Paste into the Supabase SQL Editor and run. Safe to run again.
--
-- Only the website's server touches these tables (with the secret key), so
-- row level security is on with no policies: the public API keys can't read
-- or write anything.

create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  notes text,
  location text not null,
  pickup_day text not null,
  pickup_time text not null,
  -- pending until Stripe confirms payment; cancelled if the checkout expires
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'cancelled', 'refunded')),
  fulfillment_status text not null default 'new' check (fulfillment_status in ('new', 'preparing', 'ready', 'picked_up', 'cancelled')),
  -- all amounts in cents, priced on the server from src/lib/pricing.ts
  item_count integer not null check (item_count > 0),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  card_fee_cents integer not null check (card_fee_cents >= 0),
  total_cents integer not null check (total_cents = subtotal_cents + platform_fee_cents + card_fee_cents),
  stripe_account_id text not null,
  stripe_session_id text,
  stripe_payment_intent_id text
);

create index if not exists orders_created_at_idx on orders (created_at desc);
create unique index if not exists orders_stripe_session_idx on orders (stripe_session_id);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id text not null,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  quantity integer not null check (quantity > 0)
);

create index if not exists order_items_order_idx on order_items (order_id);

alter table settings enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- New tables aren't exposed automatically in this project, so grant only the
-- server's role.
revoke all on settings, orders, order_items from anon, authenticated;
grant select, insert, update, delete on settings, orders, order_items to service_role;
