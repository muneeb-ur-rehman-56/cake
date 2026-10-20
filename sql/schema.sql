-- Sweet Crust database schema for Supabase PostgreSQL
create extension if not exists pgcrypto;
create table if not exists categories(id uuid primary key default gen_random_uuid(),name text not null unique,slug text not null unique,description text,sort_order int not null default 0,created_at timestamptz not null default now());
create table if not exists products(id uuid primary key default gen_random_uuid(),category_id uuid not null references categories(id) on delete restrict,name text not null,slug text unique,description text not null default '',price numeric(10,2) not null check(price>=0),image_url text,is_available boolean not null default true,is_featured boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists product_variants(id uuid primary key default gen_random_uuid(),product_id uuid not null references products(id) on delete cascade,name text not null,price_delta numeric(10,2) not null default 0,created_at timestamptz not null default now());
create table if not exists addons(id uuid primary key default gen_random_uuid(),product_id uuid references products(id) on delete cascade,name text not null,price numeric(10,2) not null default 0,created_at timestamptz not null default now());
create table if not exists customers(id uuid primary key default gen_random_uuid(),name text not null,phone text not null unique,email text,address text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists orders(id uuid primary key default gen_random_uuid(),order_number text not null unique,customer_id uuid references customers(id) on delete set null,customer_name text not null,phone text not null,address text not null default '',fulfillment text not null default 'delivery' check(fulfillment in ('delivery','pickup')),preferred_time text,payment_method text not null default 'cod',order_notes text,status text not null default 'Received' check(status in ('Received','Preparing','Out for Delivery','Delivered','Cancelled')),subtotal numeric(10,2) not null,delivery_fee numeric(10,2) not null default 0,discount numeric(10,2) not null default 0,total numeric(10,2) not null,coupon_code text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists order_items(id uuid primary key default gen_random_uuid(),order_id uuid not null references orders(id) on delete cascade,product_id uuid references products(id) on delete set null,product_name text not null,quantity int not null check(quantity between 1 and 50),unit_price numeric(10,2) not null,line_total numeric(10,2) not null,special_instructions text,created_at timestamptz not null default now());
create table if not exists coupons(id uuid primary key default gen_random_uuid(),code text not null unique,discount_type text not null check(discount_type in ('percent','fixed')),discount_value numeric(10,2) not null check(discount_value>0),minimum_order numeric(10,2) not null default 0,expires_at timestamptz,is_active boolean not null default true,created_at timestamptz not null default now());
create table if not exists cake_requests(id uuid primary key default gen_random_uuid(),customer_name text not null,phone text not null,occasion text not null,size text not null,flavor text not null,cake_message text,date_needed date not null,reference_image_url text,notes text,status text not null default 'New' check(status in ('New','Approved','Rejected','Completed')),admin_reply text,created_at timestamptz not null default now());
create table if not exists reservations(id uuid primary key default gen_random_uuid(),customer_name text not null,phone text not null,reservation_date date not null,reservation_time text not null,guests int not null check(guests between 1 and 30),notes text,status text not null default 'Pending' check(status in ('Pending','Approved','Rejected','Completed')),admin_reply text,created_at timestamptz not null default now());
create table if not exists reviews(id uuid primary key default gen_random_uuid(),customer_name text not null,rating int not null check(rating between 1 and 5),message text not null,is_published boolean not null default false,created_at timestamptz not null default now());
create table if not exists settings(key text primary key,value jsonb not null,updated_at timestamptz not null default now());
create table if not exists admin_users(id uuid primary key default gen_random_uuid(),email text not null unique,password_hash text not null,role text not null default 'admin',created_at timestamptz not null default now());
create table if not exists ai_conversations(id uuid primary key default gen_random_uuid(),session_id text not null,needs_human boolean not null default false,created_at timestamptz not null default now());
create table if not exists ai_messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references ai_conversations(id) on delete cascade,role text not null check(role in ('user','assistant','tool','system')),content text not null,created_at timestamptz not null default now());
create table if not exists feedback(id uuid primary key default gen_random_uuid(),name text,phone text,message text not null,kind text not null default 'feedback',status text not null default 'New',created_at timestamptz not null default now());
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_available on products(is_available);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_phone_number on orders(order_number,phone);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_cake_requests_date on cake_requests(date_needed);
create index if not exists idx_reservations_date on reservations(reservation_date);
create index if not exists idx_ai_messages_conversation on ai_messages(conversation_id,created_at);
create index if not exists idx_feedback_created on feedback(created_at desc);
-- Admin uses service-role key only on backend. Never expose it to the browser.
-- Sample settings; change values from Admin > Settings or SQL.
insert into settings(key,value) values
 ('business_name','"Sweet Crust"'::jsonb),('phone','"+92 300 0000000"'::jsonb),('whatsapp','"923000000000"'::jsonb),
 ('delivery_fee','200'::jsonb),('minimum_order','500'::jsonb),('delivery_areas','["Bhakkar","Darya Khan","Mankera"]'::jsonb),
 ('opening_hours','"Daily 9:00 AM – 10:00 PM"'::jsonb),('is_open','true'::jsonb),('ai_enabled','true'::jsonb)
on conflict(key) do nothing;
insert into categories(name,slug,description,sort_order) values
 ('Cakes','cakes','Celebration cakes and slices',1),('Pastries','pastries','Fresh pastries and doughnuts',2),('Breads','breads','Everyday breads and savoury bakes',3),('Cookies & Treats','cookies-treats','Cookies, brownies and sweet bites',4),('Drinks','drinks','Coffee and cold drinks',5)
on conflict(slug) do nothing;
insert into products(category_id,name,slug,description,price,image_url,is_featured)
select c.id,v.name,v.slug,v.description,v.price,v.image_url,v.featured from (values
 ('Cakes','Chocolate Fudge Cake','chocolate-fudge-cake','Rich chocolate layers with smooth fudge icing.',1800,'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',true),
 ('Cakes','Vanilla Celebration Cake','vanilla-celebration-cake','Soft vanilla sponge for special moments.',1600,'https://images.unsplash.com/photo-1562777717-dc6984f65a63?auto=format&fit=crop&w=600&q=80',true),
 ('Cakes','Red Velvet Cake','red-velvet-cake','Velvety cocoa cake with cream cheese-style frosting.',2000,'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=600&q=80',false),
 ('Cakes','Black Forest Cake','black-forest-cake','Chocolate sponge, cream and cherry-inspired filling.',1900,'https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&w=600&q=80',true),
 ('Pastries','Chocolate Croissant','chocolate-croissant','Flaky pastry with a chocolate centre.',280,'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',true),
 ('Pastries','Glazed Donut','glazed-donut','Soft ring donut with a sweet glaze.',180,'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=80',false),
 ('Pastries','Cream Puff','cream-puff','Light choux pastry with creamy filling.',220,'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',false),
 ('Pastries','Chicken Patties','chicken-patties','Golden flaky savoury patties.',160,'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',false),
 ('Breads','Milk Bread Loaf','milk-bread-loaf','Soft sandwich loaf for everyday meals.',220,'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',true),
 ('Breads','Garlic Bread','garlic-bread','Toasted bread with garlic and herbs.',250,'https://images.unsplash.com/photo-1619531040576-f94167406613?auto=format&fit=crop&w=600&q=80',false),
 ('Breads','Cheese Bun','cheese-bun','Soft bun with a cheesy topping.',140,'https://images.unsplash.com/photo-1608198093002-ad4e005484e5?auto=format&fit=crop&w=600&q=80',false),
 ('Cookies & Treats','Chocolate Chip Cookies','chocolate-chip-cookies','Crisp edges, soft centre and chocolate chips.',120,'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',true),
 ('Cookies & Treats','Fudge Brownie','fudge-brownie','Dense chocolate brownie with a fudgy centre.',200,'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',true),
 ('Cookies & Treats','Cinnamon Roll','cinnamon-roll','Swirled cinnamon pastry with sweet icing.',260,'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=600&q=80',false),
 ('Drinks','Hot Cappuccino','hot-cappuccino','Espresso-style coffee with steamed milk.',350,'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',false),
 ('Drinks','Iced Coffee','iced-coffee','Chilled coffee served over ice.',400,'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',false)
) as v(category,name,slug,description,price,image_url,featured)
join categories c on c.name=v.category
on conflict(slug) do nothing;
insert into product_variants(product_id,name,price_delta)
select p.id,v.name,v.delta from products p cross join (values ('1 lb',0),('2 lb',900)) v(name,delta) where p.slug in ('chocolate-fudge-cake','vanilla-celebration-cake') and not exists(select 1 from product_variants pv where pv.product_id=p.id and pv.name=v.name);
insert into addons(product_id,name,price)
select p.id,v.name,v.price from products p cross join (values ('Birthday topper',150),('Extra chocolate drizzle',100)) v(name,price) where p.slug='chocolate-fudge-cake' and not exists(select 1 from addons a where a.product_id=p.id and a.name=v.name);
insert into coupons(code,discount_type,discount_value,minimum_order,expires_at,is_active) values ('SWEET10','percent',10,1000,now()+interval '90 days',true) on conflict(code) do nothing;
