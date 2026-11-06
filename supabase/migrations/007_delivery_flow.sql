-- Deliveries get their own steps: Accept -> Out for Delivery -> Delivered (with
-- a photo). Pickup orders keep ready and picked_up. Run in the SQL Editor.

alter table orders drop constraint if exists orders_fulfillment_status_check;
alter table orders add constraint orders_fulfillment_status_check
  check (fulfillment_status in ('new', 'preparing', 'ready', 'out_for_delivery', 'picked_up', 'delivered', 'cancelled'));

alter table orders add column if not exists delivery_instructions text;
alter table orders add column if not exists delivery_photo_url text;
alter table orders add column if not exists delivered_emailed_at timestamptz;

-- Deliveries already in progress move to their new step
update orders set fulfillment_status = 'out_for_delivery' where fulfillment_type = 'delivery' and fulfillment_status = 'ready';
update orders set fulfillment_status = 'delivered' where fulfillment_type = 'delivery' and fulfillment_status = 'picked_up';
