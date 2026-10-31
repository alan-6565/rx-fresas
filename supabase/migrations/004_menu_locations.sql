-- Menu and locations the staff edit from the dashboard, plus storage for their
-- photos. Run after 003. Safe to run again: it only adds what's missing and
-- never overwrites edits.

create table if not exists menu_categories (
  id text primary key,
  label text not null,
  title text not null,
  sort integer not null default 0
);

create table if not exists menu_items (
  id text primary key,
  category_id text not null references menu_categories(id) on update cascade,
  name text not null,
  description text not null default '',
  price_cents integer not null check (price_cents between 0 and 100000),
  image_url text not null default '',
  -- false hides it from the website and online orders
  available boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_category_idx on menu_items (category_id, sort);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default 'Richmond, CA',
  -- what Google Maps searches for; the name and city are used if it's empty
  address text not null default '',
  -- exact pin for the map and directions; the address is used if they're empty
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  image_url text not null default '',
  -- false hides it from the website and online orders
  active boolean not null default true,
  -- 7 entries, Sunday first: {"open": true, "start": "18:00", "end": "22:00"}
  hours jsonb not null,
  -- "Closed today" switch: no pickups at this spot on this Pacific date
  closed_on date,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table locations enable row level security;
revoke all on menu_categories, menu_items, locations from anon, authenticated;
grant select, insert, update, delete on menu_categories, menu_items, locations to service_role;

-- Starting menu: what the website showed before the dashboard could edit it
insert into menu_categories (id, label, title, sort) values
  ('cafes', 'Cafés', 'Cafés Fríos y Calientes', 1),
  ('fresas', 'Fresas con Crema', 'Fresas con Crema', 2),
  ('pancakes', 'Mini Pancakes', 'Mini Pancakes', 3),
  ('otono', 'Para el Otoño', 'Para el Otoño', 4),
  ('extras', 'Extras', 'Agrega tus Toppings', 5)
on conflict (id) do nothing;

insert into menu_items (id, category_id, name, description, price_cents, image_url, sort) values
  ('caramel', 'cafes', 'Iced Caramel Latte', 'Café, leche y caramelo', 700, '/images/d-caramel.jpg', 1),
  ('cookies', 'cafes', 'Iced Cookies & Cream', 'Café, leche y oreo', 700, '/images/d-cookies.jpg', 2),
  ('strawberry', 'cafes', 'Iced Strawberry Latte', 'Café, leche y fresa', 700, '/images/d-strawberry.jpg', 3),
  ('vanilla', 'cafes', 'Iced Vanilla Latte', 'Café, leche y vainilla', 700, '/images/d-vanilla.jpg', 4),
  ('fresa-clasica', 'fresas', 'Fresa Clásica', 'Fresas, crema y granola', 800, '/images/f-clasica.jpg', 1),
  ('fresa-nutella', 'fresas', 'Fresa con Nutella', 'Fresas, crema, nutella y toppings', 900, '/images/f-nutella.jpg', 2),
  ('fresa-especial', 'fresas', 'Fresa Especial', 'Fresas, crema, plátano y más toppings', 900, '/images/f-especial.jpg', 3),
  ('pancakes-10', 'pancakes', 'Mini Pancakes (10 ct)', '1 fruta, 1 drizzle, 2 toppings', 800, '/images/p-10.jpg', 1),
  ('pancakes-15', 'pancakes', 'Mini Pancakes (15 ct)', '2 frutas, 2 drizzle, 2 toppings', 1200, '/images/p-15.jpg', 2),
  ('pancakes-20', 'pancakes', 'Mini Pancakes (20 ct)', '2 frutas, 2 drizzle, 3 toppings', 1500, '/images/p-20.jpg', 3),
  ('pancakes-25', 'pancakes', 'Mini Pancakes (25 ct)', 'Crea el tuyo', 1800, '/images/p-25.jpg', 4),
  ('malvavisco', 'otono', 'Malvavisco Latte', 'Café, leche, chocolate y malvaviscos tostados', 700, '/images/o-malvavisco.jpg', 1),
  ('calabaza', 'otono', 'Dulce Calabaza Latte', 'Café, leche, pumpkin spice y crema', 700, '/images/o-calabaza.jpg', 2)
on conflict (id) do nothing;

-- The two stops the owners gave: mornings, then from late afternoon. Names and
-- hours are a first guess for the staff to correct on the Locations screen.
insert into locations (name, city, address, lat, lng, image_url, hours, sort)
select v.name, 'Richmond, CA', '', v.lat, v.lng, v.image_url,
  (select jsonb_agg(jsonb_build_object('open', g.day > 0, 'start', v.start_at, 'end', v.end_at)) from generate_series(1, 7) as g(day)),
  v.sort
from (values
  ('Parada de la mañana', 37.9585952, -122.3586999, '/images/truck-portal.jpg', '08:00', '14:00', 1),
  ('Parada de la tarde', 37.9639945, -122.3180908, '/images/truck-sanpablo.jpg', '17:00', '22:00', 2)
) as v(name, lat, lng, image_url, start_at, end_at, sort)
where not exists (select 1 from locations);

-- Photos uploaded from the dashboard. Public to read (they're on the website);
-- only the website's server can upload, using the secret key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
