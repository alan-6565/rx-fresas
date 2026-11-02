-- Delivery, reward points and customer emails. Run after 005.
-- Safe to run again.

-- Pickup at the truck or delivered to an address
alter table orders add column if not exists fulfillment_type text not null default 'pickup';
alter table orders drop constraint if exists orders_fulfillment_type_check;
alter table orders add constraint orders_fulfillment_type_check check (fulfillment_type in ('pickup', 'delivery'));
alter table orders add column if not exists delivery_address text;
-- R&X's delivery charge (all theirs, no platform fee on it)
alter table orders add column if not exists delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0);

-- A free drink paid for with points: the drink's menu price comes off
alter table orders add column if not exists discount_cents integer not null default 0 check (discount_cents >= 0);
alter table orders add column if not exists points_redeemed integer not null default 0 check (points_redeemed >= 0);

-- So each email only goes out once
alter table orders add column if not exists confirmation_emailed_at timestamptz;
alter table orders add column if not exists ready_emailed_at timestamptz;

-- The original total check (named orders_check) didn't know about these
alter table orders drop constraint if exists orders_check;
alter table orders drop constraint if exists orders_total_cents_check;
alter table orders add constraint orders_total_cents_check
  check (total_cents = subtotal_cents - discount_cents + delivery_fee_cents + platform_fee_cents + card_fee_cents);

create index if not exists orders_customer_phone_idx on orders (customer_phone);

-- One-time codes emailed to a customer before they use their points
create table if not exists reward_codes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  phone text not null,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used_at timestamptz,
  order_id uuid references orders(id) on delete set null
);

create index if not exists reward_codes_phone_idx on reward_codes (phone, created_at desc);

alter table reward_codes enable row level security;
revoke all on reward_codes from anon, authenticated;
grant select, insert, update, delete on reward_codes to service_role;
