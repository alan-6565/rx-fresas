-- The wording of an order's discount, kept for its receipt and emails. Run in the SQL Editor.
alter table orders add column if not exists discount_label text;
