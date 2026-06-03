-- ============================================================
-- RevConnect-1 Complete Database Schema
-- Migration 001 — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";  -- for geo queries on events/washes

-- ============================================================
-- ENUMS
-- ============================================================
create type membership_tier as enum ('cruiser', 'builder', 'racer', 'legend');
create type vehicle_status as enum ('active', 'project', 'for_sale', 'sold', 'parted_out', 'archived');
create type event_type as enum ('street_meet', 'car_show', 'track_day', 'cruise', 'drag', 'autocross', 'hpde', 'popup');
create type part_condition as enum ('new_oem', 'new_aftermarket', 'remanufactured', 'used', 'performance');
create type auction_type as enum ('public', 'dealer', 'collector', 'online', 'specialty');
create type wash_type as enum ('tunnel_soft', 'tunnel_touchless', 'tunnel_hybrid', 'self_service', 'hand_wash', 'mobile_detailer', 'full_detail', 'waterless', 'rinseless');
create type order_status as enum ('pending', 'processing', 'shipped', 'delivered', 'returned', 'refunded', 'cancelled');
create type paint_protection as enum ('bare', 'wax', 'sealant', 'ceramic', 'ppf', 'vinyl');
create type skill_level as enum ('beginner', 'intermediate', 'advanced', 'professional');
create type price_range as enum ('$', '$$', '$$$', '$$$$');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  username            text unique not null,
  display_name        text,
  bio                 text,
  avatar_url          text,
  banner_url          text,
  location            text,
  years_in_scene      smallint,
  skill_level         skill_level,
  specialty           text[],
  membership_tier     membership_tier not null default 'cruiser',
  rev_points          integer not null default 0,
  stripe_customer_id  text unique,
  stripe_subscription_id text,
  follower_count      integer not null default 0,
  following_count     integer not null default 0,
  is_verified_builder boolean not null default false,
  social_instagram    text,
  social_tiktok       text,
  social_youtube      text,
  social_twitter      text,
  social_discord      text,
  website             text,
  is_public           boolean not null default true,
  push_token          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index profiles_username_idx on profiles(username);
create index profiles_membership_tier_idx on profiles(membership_tier);

-- ============================================================
-- VEHICLES
-- ============================================================
create table vehicles (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  year            smallint not null,
  make            text not null,
  model           text not null,
  trim            text,
  nickname        text,
  vin             text,
  color           text,
  exterior_color  text,
  interior_color  text,
  mileage         integer,
  status          vehicle_status not null default 'active',
  hero_image_url  text,
  gallery_images  text[] not null default '{}',
  purchase_date   date,
  purchase_price  numeric(12,2),
  purchase_story  text,
  paint_protection paint_protection,
  is_primary      boolean not null default false,
  is_for_sale     boolean not null default false,
  asking_price    numeric(12,2),
  total_build_cost numeric(12,2) not null default 0,
  factory_build_sheet jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index vehicles_owner_id_idx on vehicles(owner_id);
create index vehicles_make_model_idx on vehicles(make, model);
create index vehicles_for_sale_idx on vehicles(is_for_sale) where is_for_sale = true;

-- ============================================================
-- VEHICLE MODIFICATIONS
-- ============================================================
create table vehicle_modifications (
  id              uuid primary key default uuid_generate_v4(),
  vehicle_id      uuid not null references vehicles(id) on delete cascade,
  category        text not null,
  part_name       text not null,
  brand           text,
  part_number     text,
  source          text,
  source_url      text,
  install_date    date,
  cost            numeric(10,2),
  is_diy          boolean not null default true,
  shop_name       text,
  difficulty_rating smallint check (difficulty_rating between 1 and 10),
  notes           text,
  before_photo_url text,
  after_photo_url  text,
  dyno_hp_gain    numeric(6,1),
  dyno_tq_gain    numeric(6,1),
  weight_saved_oz  numeric(8,1),
  created_at      timestamptz not null default now()
);

create index vehicle_mods_vehicle_id_idx on vehicle_modifications(vehicle_id);

-- ============================================================
-- VEHICLE MAINTENANCE
-- ============================================================
create table vehicle_maintenance (
  id                    uuid primary key default uuid_generate_v4(),
  vehicle_id            uuid not null references vehicles(id) on delete cascade,
  service_type          text not null,
  date                  date not null,
  mileage               integer,
  cost                  numeric(10,2),
  shop_name             text,
  is_diy                boolean not null default false,
  notes                 text,
  next_service_mileage  integer,
  next_service_date     date,
  receipt_url           text,
  created_at            timestamptz not null default now()
);

create index vehicle_maintenance_vehicle_id_idx on vehicle_maintenance(vehicle_id);

-- ============================================================
-- VEHICLE PERFORMANCE LOGS
-- ============================================================
create table vehicle_performance_logs (
  id              uuid primary key default uuid_generate_v4(),
  vehicle_id      uuid not null references vehicles(id) on delete cascade,
  log_type        text not null, -- 'dyno', 'drag', 'autocross', 'lap'
  date            date not null,
  venue           text,
  hp              numeric(7,1),
  torque          numeric(7,1),
  et_quarter      numeric(6,3), -- quarter mile ET
  mph_quarter     numeric(6,2),
  et_eighth       numeric(6,3),
  zero_to_sixty   numeric(6,3),
  lap_time        numeric(8,3),
  track_name      text,
  conditions      text,
  tune_version    text,
  notes           text,
  dyno_sheet_url  text,
  timeslip_url    text,
  created_at      timestamptz not null default now()
);

create index vehicle_perf_logs_vehicle_id_idx on vehicle_performance_logs(vehicle_id);

-- ============================================================
-- CLUBS
-- ============================================================
create table clubs (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references profiles(id),
  name            text not null,
  slug            text unique not null,
  description     text,
  logo_url        text,
  banner_url      text,
  location        text,
  member_count    integer not null default 0,
  is_private      boolean not null default false,
  join_questions  text[],
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now()
);

create index clubs_slug_idx on clubs(slug);

create table club_members (
  club_id     uuid not null references clubs(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  role        text not null default 'member', -- 'owner', 'admin', 'member'
  joined_at   timestamptz not null default now(),
  primary key (club_id, user_id)
);

-- ============================================================
-- EVENTS
-- ============================================================
create table events (
  id                    uuid primary key default uuid_generate_v4(),
  organizer_id          uuid not null references profiles(id),
  title                 text not null,
  description           text,
  event_type            event_type not null,
  address               text not null,
  city                  text not null,
  state                 text not null,
  zip                   text not null,
  lat                   numeric(9,6),
  lng                   numeric(9,6),
  starts_at             timestamptz not null,
  ends_at               timestamptz,
  cover_image_url       text,
  gallery_images        text[] not null default '{}',
  max_attendees         integer,
  current_attendees     integer not null default 0,
  entry_fee             numeric(8,2),
  registration_url      text,
  registration_required boolean not null default false,
  qr_code               text unique default encode(gen_random_bytes(16), 'hex'),
  club_id               uuid references clubs(id),
  is_published          boolean not null default false,
  is_cancelled          boolean not null default false,
  weather_sensitive     boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index events_starts_at_idx on events(starts_at);
create index events_city_state_idx on events(city, state);
create index events_organizer_idx on events(organizer_id);
create index events_published_idx on events(is_published) where is_published = true;
create index events_location_idx on events(lat, lng) where lat is not null;

create table event_attendees (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references events(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  vehicle_id      uuid references vehicles(id),
  checked_in      boolean not null default false,
  checked_in_at   timestamptz,
  created_at      timestamptz not null default now(),
  unique (event_id, user_id)
);

create index event_attendees_event_idx on event_attendees(event_id);
create index event_attendees_user_idx on event_attendees(user_id);

-- ============================================================
-- POSTS (community feed)
-- ============================================================
create table posts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  vehicle_id      uuid references vehicles(id) on delete set null,
  event_id        uuid references events(id) on delete set null,
  content         text,
  images          text[] not null default '{}',
  videos          text[] not null default '{}',
  like_count      integer not null default 0,
  comment_count   integer not null default 0,
  share_count     integer not null default 0,
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index posts_user_id_idx on posts(user_id);
create index posts_created_at_idx on posts(created_at desc);

create table post_likes (
  post_id    uuid not null references posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table post_comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- FOLLOWS
-- ============================================================
create table follows (
  follower_id   uuid not null references profiles(id) on delete cascade,
  following_id  uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create index follows_following_id_idx on follows(following_id);

-- ============================================================
-- MARKETPLACE LISTINGS
-- ============================================================
create table marketplace_listings (
  id                  uuid primary key default uuid_generate_v4(),
  seller_id           uuid not null references profiles(id) on delete cascade,
  vehicle_id          uuid references vehicles(id) on delete set null,
  listing_type        text not null default 'part', -- 'part', 'vehicle'
  title               text not null,
  description         text,
  price               numeric(12,2) not null,
  condition           part_condition not null,
  category            text not null,
  make_fitment        text[],
  model_fitment       text[],
  year_fitment_min    smallint,
  year_fitment_max    smallint,
  images              text[] not null default '{}',
  location            text,
  state               text,
  zip                 text,
  is_sold             boolean not null default false,
  is_active           boolean not null default true,
  sold_at             timestamptz,
  view_count          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index marketplace_seller_idx on marketplace_listings(seller_id);
create index marketplace_category_idx on marketplace_listings(category);
create index marketplace_active_idx on marketplace_listings(is_active, is_sold);
create index marketplace_fitment_idx on marketplace_listings using gin(make_fitment, model_fitment);

-- ============================================================
-- VENDORS
-- ============================================================
create table vendors (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text unique not null,
  category            text not null,
  subcategories       text[] not null default '{}',
  description         text,
  logo_url            text,
  banner_url          text,
  website             text,
  phone               text,
  email               text,
  address             text,
  city                text,
  state               text,
  zip                 text,
  lat                 numeric(9,6),
  lng                 numeric(9,6),
  is_featured         boolean not null default false,
  is_verified         boolean not null default false,
  is_local            boolean not null default false,
  stripe_account_id   text,
  discount_code       text,
  discount_pct        smallint,
  created_at          timestamptz not null default now()
);

create index vendors_category_idx on vendors(category);
create index vendors_featured_idx on vendors(is_featured) where is_featured = true;
create index vendors_location_idx on vendors(lat, lng) where lat is not null;

-- ============================================================
-- AUCTIONS
-- ============================================================
create table auctions (
  id                uuid primary key default uuid_generate_v4(),
  source            text not null, -- 'bring_a_trailer', 'cars_and_bids', 'copart', etc.
  external_id       text,
  auction_type      auction_type not null,
  title             text not null,
  year              smallint,
  make              text,
  model             text,
  trim              text,
  vin               text,
  mileage           integer,
  condition         text,
  current_bid       numeric(12,2),
  reserve_met       boolean,
  buy_now_price     numeric(12,2),
  buyer_premium_pct numeric(5,2),
  images            text[] not null default '{}',
  auction_url       text not null,
  location          text,
  state             text,
  starts_at         timestamptz,
  ends_at           timestamptz,
  lot_number        text,
  description       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(source, external_id)
);

create index auctions_source_idx on auctions(source);
create index auctions_ends_at_idx on auctions(ends_at);
create index auctions_make_model_idx on auctions(make, model);

create table auction_watchlist (
  user_id     uuid not null references profiles(id) on delete cascade,
  auction_id  uuid not null references auctions(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, auction_id)
);

-- ============================================================
-- CAR WASHES
-- ============================================================
create table car_washes (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  wash_type             wash_type not null,
  address               text not null,
  city                  text not null,
  state                 text not null,
  zip                   text not null,
  lat                   numeric(9,6) not null,
  lng                   numeric(9,6) not null,
  phone                 text,
  website               text,
  hours                 jsonb,
  price_range           price_range,
  is_ceramic_safe       boolean not null default false,
  is_ppf_safe           boolean not null default false,
  is_touchless          boolean not null default false,
  has_undercarriage     boolean not null default false,
  has_spot_free_rinse   boolean not null default false,
  has_membership        boolean not null default false,
  is_lowered_safe       boolean not null default true,
  google_place_id       text unique,
  rating                numeric(3,1),
  review_count          integer not null default 0,
  community_verified    boolean not null default false,
  damage_reports        integer not null default 0,
  created_at            timestamptz not null default now()
);

create index car_washes_location_idx on car_washes(lat, lng);
create index car_washes_ceramic_safe_idx on car_washes(is_ceramic_safe) where is_ceramic_safe = true;

-- ============================================================
-- INSURANCE QUOTES
-- ============================================================
create table insurance_quotes (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references profiles(id) on delete cascade,
  vehicle_id          uuid not null references vehicles(id) on delete cascade,
  carrier_name        text not null,
  coverage_type       text not null,
  annual_premium      numeric(10,2) not null,
  monthly_premium     numeric(10,2) not null,
  deductible          numeric(10,2),
  agreed_value        numeric(12,2),
  stated_value        numeric(12,2),
  liability_limits    text,
  includes_track      boolean not null default false,
  includes_mods       boolean not null default false,
  includes_roadside   boolean not null default false,
  mod_coverage_limit  numeric(12,2),
  am_best_rating      text,
  quote_url           text,
  expires_at          timestamptz,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create index insurance_quotes_user_idx on insurance_quotes(user_id);
create index insurance_quotes_vehicle_idx on insurance_quotes(vehicle_id);

-- ============================================================
-- MERCHANDISE / STORE
-- ============================================================
create table products (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text unique not null,
  description         text,
  category            text not null,
  subcategory         text,
  images              text[] not null default '{}',
  base_price          numeric(10,2) not null,
  compare_at_price    numeric(10,2),
  stripe_product_id   text unique,
  stripe_price_id     text,
  inventory           integer not null default 0,
  is_customizable     boolean not null default false,
  is_limited          boolean not null default false,
  is_active           boolean not null default true,
  tags                text[] not null default '{}',
  rev_points_earn     integer not null default 0,
  weight_oz           numeric(6,1),
  sizes               text[],
  colors              text[],
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index products_category_idx on products(category);
create index products_active_idx on products(is_active) where is_active = true;
create index products_tags_idx on products using gin(tags);

create table orders (
  id                          uuid primary key default uuid_generate_v4(),
  user_id                     uuid not null references profiles(id) on delete restrict,
  stripe_payment_intent_id    text unique,
  stripe_checkout_session_id  text unique,
  status                      order_status not null default 'pending',
  subtotal                    numeric(10,2) not null default 0,
  tax                         numeric(10,2) not null default 0,
  shipping                    numeric(10,2) not null default 0,
  discount                    numeric(10,2) not null default 0,
  total                       numeric(10,2) not null default 0,
  rev_points_earned           integer not null default 0,
  rev_points_redeemed         integer not null default 0,
  shipping_address            jsonb,
  tracking_number             text,
  carrier                     text,
  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index orders_user_id_idx on orders(user_id);
create index orders_status_idx on orders(status);

create table order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references orders(id) on delete cascade,
  product_id      uuid not null references products(id) on delete restrict,
  quantity        integer not null check (quantity > 0),
  unit_price      numeric(10,2) not null,
  customization   jsonb,
  created_at      timestamptz not null default now()
);

create index order_items_order_idx on order_items(order_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  data        jsonb,
  read        boolean not null default false,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_id_idx on notifications(user_id, created_at desc);
create index notifications_unread_idx on notifications(user_id) where read = false;

-- ============================================================
-- SAVED SEARCHES & ALERTS
-- ============================================================
create table saved_searches (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  search_type text not null, -- 'vehicle', 'part', 'auction', 'event'
  name        text not null,
  filters     jsonb not null,
  alert_email boolean not null default true,
  alert_push  boolean not null default true,
  last_alert  timestamptz,
  created_at  timestamptz not null default now()
);

create index saved_searches_user_idx on saved_searches(user_id);


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at columns
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger set_vehicles_updated_at before update on vehicles for each row execute function update_updated_at();
create trigger set_events_updated_at before update on events for each row execute function update_updated_at();
create trigger set_marketplace_updated_at before update on marketplace_listings for each row execute function update_updated_at();
create trigger set_orders_updated_at before update on orders for each row execute function update_updated_at();
create trigger set_products_updated_at before update on products for each row execute function update_updated_at();

-- Sync follower/following counts
create or replace function sync_follow_counts()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update profiles set following_count = following_count + 1 where id = new.follower_id;
    update profiles set follower_count  = follower_count  + 1 where id = new.following_id;
  elsif tg_op = 'DELETE' then
    update profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update profiles set follower_count  = greatest(follower_count  - 1, 0) where id = old.following_id;
  end if;
  return null;
end;
$$;

create trigger sync_follows_after_change after insert or delete on follows for each row execute function sync_follow_counts();

-- Sync event attendee count
create or replace function sync_event_attendee_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update events set current_attendees = current_attendees + 1 where id = new.event_id;
  elsif tg_op = 'DELETE' then
    update events set current_attendees = greatest(current_attendees - 1, 0) where id = old.event_id;
  end if;
  return null;
end;
$$;

create trigger sync_event_attendees after insert or delete on event_attendees for each row execute function sync_event_attendee_count();

-- Sync club member count
create or replace function sync_club_member_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update clubs set member_count = member_count + 1 where id = new.club_id;
  elsif tg_op = 'DELETE' then
    update clubs set member_count = greatest(member_count - 1, 0) where id = old.club_id;
  end if;
  return null;
end;
$$;

create trigger sync_club_members after insert or delete on club_members for each row execute function sync_club_member_count();

-- Sync post like/comment counts
create or replace function sync_post_like_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger sync_post_likes after insert or delete on post_likes for each row execute function sync_post_like_count();

create or replace function sync_post_comment_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger sync_post_comments after insert or delete on post_comments for each row execute function sync_post_comment_count();

-- Auto-update vehicle total_build_cost from mods
create or replace function sync_vehicle_build_cost()
returns trigger language plpgsql security definer as $$
begin
  update vehicles
  set total_build_cost = coalesce((
    select sum(cost) from vehicle_modifications
    where vehicle_id = coalesce(new.vehicle_id, old.vehicle_id)
      and cost is not null
  ), 0)
  where id = coalesce(new.vehicle_id, old.vehicle_id);
  return null;
end;
$$;

create trigger sync_mod_cost after insert or update or delete on vehicle_modifications for each row execute function sync_vehicle_build_cost();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table vehicle_modifications enable row level security;
alter table vehicle_maintenance enable row level security;
alter table vehicle_performance_logs enable row level security;
alter table clubs enable row level security;
alter table club_members enable row level security;
alter table events enable row level security;
alter table event_attendees enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;
alter table follows enable row level security;
alter table marketplace_listings enable row level security;
alter table vendors enable row level security;
alter table auctions enable row level security;
alter table auction_watchlist enable row level security;
alter table car_washes enable row level security;
alter table insurance_quotes enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table notifications enable row level security;
alter table saved_searches enable row level security;

-- PROFILES
create policy "profiles_public_read" on profiles for select using (is_public = true or auth.uid() = id);
create policy "profiles_own_all" on profiles for all using (auth.uid() = id);

-- VEHICLES
create policy "vehicles_public_read" on vehicles for select using (
  exists (select 1 from profiles where id = vehicles.owner_id and is_public = true)
  or auth.uid() = owner_id
);
create policy "vehicles_own_write" on vehicles for insert with check (auth.uid() = owner_id);
create policy "vehicles_own_update" on vehicles for update using (auth.uid() = owner_id);
create policy "vehicles_own_delete" on vehicles for delete using (auth.uid() = owner_id);

-- VEHICLE MODIFICATIONS / MAINTENANCE / PERFORMANCE
create policy "mods_owner_all" on vehicle_modifications for all using (
  auth.uid() = (select owner_id from vehicles where id = vehicle_id)
);
create policy "maintenance_owner_all" on vehicle_maintenance for all using (
  auth.uid() = (select owner_id from vehicles where id = vehicle_id)
);
create policy "perf_logs_owner_all" on vehicle_performance_logs for all using (
  auth.uid() = (select owner_id from vehicles where id = vehicle_id)
);

-- EVENTS
create policy "events_public_read" on events for select using (is_published = true or auth.uid() = organizer_id);
create policy "events_authenticated_insert" on events for insert with check (auth.uid() = organizer_id);
create policy "events_own_update" on events for update using (auth.uid() = organizer_id);
create policy "events_own_delete" on events for delete using (auth.uid() = organizer_id);

-- EVENT ATTENDEES
create policy "attendees_event_read" on event_attendees for select using (
  auth.uid() = user_id or auth.uid() = (select organizer_id from events where id = event_id)
);
create policy "attendees_own_write" on event_attendees for insert with check (auth.uid() = user_id);
create policy "attendees_own_delete" on event_attendees for delete using (auth.uid() = user_id);

-- POSTS
create policy "posts_public_read" on posts for select using (is_published = true);
create policy "posts_own_write" on posts for all using (auth.uid() = user_id);

-- FOLLOWS
create policy "follows_public_read" on follows for select using (true);
create policy "follows_own_write" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_own_delete" on follows for delete using (auth.uid() = follower_id);

-- MARKETPLACE
create policy "marketplace_public_read" on marketplace_listings for select using (is_active = true);
create policy "marketplace_own_write" on marketplace_listings for all using (auth.uid() = seller_id);

-- VENDORS (public read, admin write)
create policy "vendors_public_read" on vendors for select using (true);

-- AUCTIONS (public read)
create policy "auctions_public_read" on auctions for select using (true);
create policy "watchlist_own" on auction_watchlist for all using (auth.uid() = user_id);

-- CAR WASHES (public read)
create policy "car_washes_public_read" on car_washes for select using (true);

-- INSURANCE QUOTES
create policy "insurance_own" on insurance_quotes for all using (auth.uid() = user_id);

-- PRODUCTS (public read)
create policy "products_public_read" on products for select using (is_active = true);

-- ORDERS
create policy "orders_own" on orders for all using (auth.uid() = user_id);
create policy "order_items_own" on order_items for select using (
  auth.uid() = (select user_id from orders where id = order_id)
);

-- NOTIFICATIONS
create policy "notifications_own" on notifications for all using (auth.uid() = user_id);

-- SAVED SEARCHES
create policy "saved_searches_own" on saved_searches for all using (auth.uid() = user_id);

-- CLUBS
create policy "clubs_public_read" on clubs for select using (is_private = false or exists (select 1 from club_members where club_id = clubs.id and user_id = auth.uid()));
create policy "clubs_own_write" on clubs for all using (auth.uid() = owner_id);
create policy "club_members_read" on club_members for select using (true);
create policy "club_members_own_write" on club_members for insert with check (auth.uid() = user_id);
create policy "club_members_own_delete" on club_members for delete using (auth.uid() = user_id);

