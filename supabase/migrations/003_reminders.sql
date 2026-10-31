-- Repeat reminders: when an order was paid, so the iPad can be reminded every
-- 30 seconds until someone accepts it. Run after 002. Safe to run again.
--
-- The 30-second timer itself (pg_cron calling the website) holds a secret, so
-- it isn't in this repo; it's set up once in the SQL Editor.

alter table orders add column if not exists paid_at timestamptz;
update orders set paid_at = created_at where payment_status in ('paid', 'refunded') and paid_at is null;

create index if not exists orders_waiting_idx on orders (paid_at) where payment_status = 'paid' and fulfillment_status = 'new';
