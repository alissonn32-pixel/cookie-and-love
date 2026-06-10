-- Cookie & Love: initial schema (products, store settings, orders, reviews)

create type product_category as enum ('destaque', 'cookie', 'especial');
create type product_badge as enum ('novo', 'mais_vendido');
create type delivery_type as enum ('retirada', 'entrega');
create type payment_method_type as enum ('pix', 'dinheiro', 'cartao');

create table products (
  id text primary key,
  name text not null,
  description text not null,
  price numeric not null,
  image_url text not null,
  category product_category not null,
  badge product_badge,
  stock_today int,
  active boolean not null default true
);

create table store_settings (
  id int primary key default 1,
  is_open boolean not null default true,
  prep_time_minutes int not null,
  min_order_value numeric not null default 0,
  hero_text text not null,
  whatsapp_target text not null,
  payment_methods jsonb not null,
  delivery_options jsonb not null,
  tabs_config jsonb not null,
  constraint single_row check (id = 1)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  whatsapp text not null,
  pickup_time text not null,
  delivery_type delivery_type not null,
  payment_method payment_method_type not null,
  notes text,
  items jsonb not null,
  total numeric not null,
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row level security
alter table products enable row level security;
alter table store_settings enable row level security;
alter table orders enable row level security;
alter table reviews enable row level security;

create policy "Public read access to products" on products
  for select using (true);

create policy "Public read access to store settings" on store_settings
  for select using (true);

create policy "Public read access to approved reviews" on reviews
  for select using (approved = true);

-- Seed data: products
insert into products (id, name, description, price, image_url, category, badge, stock_today, active) values
  ('big-apple-choc-chunk', 'Big Apple Choc Chunk', 'Massa amanteigada com gotas de chocolate belga', 12.90, '/products/big-apple-choc-chunk.jpg', 'destaque', 'mais_vendido', null, true),
  ('brooklyn-red-velvet', 'Brooklyn Red Velvet', 'Cookie red velvet com recheio de cream cheese', 13.90, '/products/brooklyn-red-velvet.jpg', 'destaque', 'novo', null, true),
  ('central-park-oatmeal', 'Central Park Oatmeal', 'Aveia, canela e passas, textura macia', 11.90, '/products/central-park-oatmeal.jpg', 'cookie', null, null, true),
  ('harlem-peanut-butter', 'Harlem Peanut Butter', 'Pasta de amendoim com gotas de chocolate ao leite', 13.50, '/products/harlem-peanut-butter.jpg', 'cookie', null, 0, true),
  ('soho-triple-chocolate', 'SoHo Triple Chocolate', 'Massa de cacau com três tipos de chocolate', 14.90, '/products/soho-triple-chocolate.jpg', 'especial', 'mais_vendido', 5, true),
  ('tribeca-salted-caramel', 'Tribeca Salted Caramel', 'Recheio de doce de leite com flor de sal', 15.90, '/products/tribeca-salted-caramel.jpg', 'especial', 'novo', null, true);

-- Seed data: store settings (single row)
insert into store_settings (id, is_open, prep_time_minutes, min_order_value, hero_text, whatsapp_target, payment_methods, delivery_options, tabs_config) values (
  1,
  true,
  40,
  0,
  'Crocante por fora, derretendo por dentro.',
  '5500000000000',
  '["pix", "dinheiro", "cartao"]',
  '["retirada", "entrega"]',
  '[{"id":"destaques","label":"Destaques"},{"id":"cookies","label":"Cookies"},{"id":"especiais","label":"Especiais da casa"},{"id":"avaliacoes","label":"Avaliações"},{"id":"informacoes","label":"Informações"}]'
);
