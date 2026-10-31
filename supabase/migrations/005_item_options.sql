-- Drink options: sizes, crema, drizzles, toppings, add-ons. Run after 004.
-- Safe to run again.

-- The choices a customer can make for an item, edited from the dashboard:
-- [{"id": "size", "name": "Tamaño", "min": 1, "max": 1,
--   "choices": [{"id": "12oz", "name": "12 oz", "price_cents": 0}, ...]}]
alter table menu_items add column if not exists options jsonb not null default '[]';

-- What the customer picked, copied onto the order so it never changes later:
-- [{"group": "Tamaño", "name": "16 oz", "price_cents": 200}]
-- order_items.price_cents is the price of one, options included.
alter table order_items add column if not exists options jsonb not null default '[]';
