-- Lady Fresh — schéma Postgres (Supabase)
-- À exécuter dans SQL Editor. Idempotent : peut être relancé.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- énumérations
do $$ begin
  create type purchase_type as enum ('gros','demi_gros');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_channel as enum ('whatsapp','formulaire');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('nouvelle','en_cours','traitee','livree');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------- gammes
create table if not exists gammes (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  tagline     text not null default '',
  description text not null default '',
  color_hex   text not null default '#000000',
  color_name  text not null default '',
  cover_image text not null default '',
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------- types de produits
-- Les types sont des données : la marque en ajoute sans toucher au code.
create table if not exists product_types (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  name_ar       text,
  name_en       text,
  short_name    text not null default '',
  short_name_ar text,
  short_name_en text,
  sort_order    int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- -------------------------------------------------------------------- produits
create table if not exists products (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  type_id    uuid references product_types(id) on delete restrict,
  gamme_id   uuid references gammes(id) on delete cascade,
  color_name text not null default '',
  color_hex  text not null default '#000000',
  image      text not null default '',
  sort_order int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_gamme_idx on products(gamme_id);
create index if not exists products_type_idx  on products(type_id);

-- Une ligne par taille : le prix et la photo dépendent du format.
create table if not exists product_variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references products(id) on delete cascade,
  size_label       text not null,
  price_demi_gros  numeric(10,2) not null check (price_demi_gros >= 0),
  price_gros       numeric(10,2) not null check (price_gros >= 0),
  units_per_carton int not null default 12 check (units_per_carton > 0),
  image            text not null default '',
  sort_order       int not null default 0,
  active           boolean not null default true
);
create index if not exists variants_product_idx on product_variants(product_id);

-- ------------------------------------------------------------------ commandes
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  ref           text unique not null,
  customer_name text not null default '',
  phone         text not null default '',
  wilaya        text not null default '',
  address       text not null default '',
  note          text not null default '',
  channel       order_channel not null,
  source        text not null default '',
  purchase_type purchase_type not null,
  total         numeric(12,2) not null default 0,
  status        order_status not null default 'nouvelle',
  created_at    timestamptz not null default now()
);
create index if not exists orders_created_idx on orders(created_at desc);
create index if not exists orders_status_idx  on orders(status);

create table if not exists order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  variant_id       uuid references product_variants(id) on delete set null,
  product_name     text not null,
  gamme_name       text not null default '',
  size_label       text not null default '',
  unit_price       numeric(10,2) not null,
  quantity         int not null check (quantity > 0),
  units_per_carton int not null default 12,
  line_total       numeric(12,2) not null
);
create index if not exists order_items_order_idx on order_items(order_id);

-- -------------------------------------------------------------------- contenu
create table if not exists hero_slides (
  id         uuid primary key default gen_random_uuid(),
  image      text not null,
  gamme_id   uuid references gammes(id) on delete set null,
  eyebrow    text not null default '',
  caption    text not null default '',
  sort_order int not null default 0
);

create table if not exists videos (
  id         uuid primary key default gen_random_uuid(),
  title      text not null default '',
  note       text not null default '',
  src        text not null,
  poster     text,
  sort_order int not null default 0
);

-- Ligne unique : réglages du site.
create table if not exists site_settings (
  id                    text primary key default 'settings',
  locale                text not null default 'fr',
  whatsapp_number       text not null default '213000000000',
  min_gros_cartons      int  not null default 1,
  min_demi_gros_pieces  int  not null default 5,
  hero_eyebrow          text not null default '',
  hero_title            text not null default '',
  hero_lede             text not null default '',
  contact_email         text not null default '',
  contact_phone         text not null default '',
  contact_address       text not null default '',
  instagram_url         text not null default '',
  facebook_url          text not null default '',
  tiktok_url            text not null default '',
  constraint settings_singleton check (id = 'settings')
);
insert into site_settings (id) values ('settings') on conflict do nothing;

-- ------------------------------------------------------------------------ RLS
-- Le catalogue est public en lecture. Les commandes, elles, ne sont NI
-- lisibles NI écrivables avec la clé anon : elles passent toutes par
-- /api/orders, qui recalcule les prix côté serveur puis écrit avec la
-- service-role key. Ouvrir l'insertion au public annulerait ce contrôle —
-- n'importe qui pourrait poster une commande à 0 DA directement sur l'API
-- REST de Supabase, la clé anon étant publique par construction.

alter table gammes           enable row level security;
alter table product_types    enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table hero_slides      enable row level security;
alter table videos           enable row level security;
alter table site_settings    enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['gammes','product_types','products','product_variants','hero_slides','videos','site_settings']
  loop
    execute format('drop policy if exists "public read %1$s" on %1$I', t);
    execute format('create policy "public read %1$s" on %1$I for select using (true)', t);
  end loop;
end $$;

-- Aucune policy sur orders ni order_items : RLS active sans policy = tout est
-- refusé à la clé anon. Seule la service-role key, qui contourne RLS et ne
-- quitte jamais le serveur, lit et écrit ces tables.
drop policy if exists "public insert orders" on orders;
drop policy if exists "public insert order_items" on order_items;

-- -------------------------------------------------------------- stockage
-- Bucket public pour les images de gammes, les visuels du hero et les vidéos.
-- L'admin panel y téléverse via la service-role key ; personne d'autre n'écrit.
--
-- Selon le rôle avec lequel tourne l'éditeur SQL, la création de policies sur
-- storage.objects peut être refusée. On l'enveloppe donc : un refus ici ne
-- doit pas faire échouer tout le script. Le bucket peut aussi se créer à la
-- main dans Storage > New bucket > « media », public.
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do nothing;
exception when others then
  raise notice 'Bucket media non créé (%). Créez-le à la main dans Storage.', sqlerrm;
end $$;

do $$
begin
  drop policy if exists "media public read" on storage.objects;
  create policy "media public read" on storage.objects
    for select using (bucket_id = 'media');
  -- Pas de policy d'insert/update/delete : seul le serveur téléverse.
  drop policy if exists "media public write" on storage.objects;
exception when others then
  raise notice 'Policies storage non posées (%). Réglez la lecture publique depuis l''interface.', sqlerrm;
end $$;

-- ------------------------------------------------------------- trilingue
-- Le français reste la colonne de référence ; `_ar` et `_en` sont facultatives
-- et le site retombe sur le français quand elles sont vides.

alter table product_types add column if not exists name_ar        text;
alter table product_types add column if not exists name_en        text;
alter table product_types add column if not exists short_name_ar  text;
alter table product_types add column if not exists short_name_en  text;

alter table gammes        add column if not exists tagline_ar     text;
alter table gammes        add column if not exists tagline_en     text;
alter table gammes        add column if not exists description_ar text;
alter table gammes        add column if not exists description_en text;

alter table hero_slides   add column if not exists eyebrow_ar text;
alter table hero_slides   add column if not exists eyebrow_en text;
alter table hero_slides   add column if not exists caption_ar text;
alter table hero_slides   add column if not exists caption_en text;

alter table videos        add column if not exists title_ar text;
alter table videos        add column if not exists title_en text;
alter table videos        add column if not exists note_ar  text;
alter table videos        add column if not exists note_en  text;

alter table site_settings add column if not exists locale          text not null default 'fr';
alter table orders        add column if not exists source          text not null default '';

alter table site_settings add column if not exists hero_eyebrow_ar text;
alter table site_settings add column if not exists hero_eyebrow_en text;
alter table site_settings add column if not exists hero_title_ar   text;
alter table site_settings add column if not exists hero_title_en   text;
alter table site_settings add column if not exists hero_lede_ar    text;
alter table site_settings add column if not exists hero_lede_en    text;

-- ------------------------------------------------------------------- pistes
/*
  Les paniers laissés en route.

  Le pixel disait qu'une part des visiteurs remplissait le bon de commande sans
  jamais l'envoyer. Sans trace, ces gens-là sont perdus : ils ont dit ce qu'ils
  voulaient et comment les joindre, et personne ne les rappelle.

  Une piste s'écrit dès qu'un numéro complet est saisi, puis se met à jour tant
  que la personne modifie son panier. `piste_id` porte ce numéro sous forme
  normalisée : c'est lui qui distingue deux clientes, et non le navigateur —
  deux commandes passées depuis le même téléphone doivent faire deux lignes.

  La table est délibérément séparée des commandes. Une piste n'est pas une
  vente : elle n'a pas de référence, pas de prix figé, et elle s'efface quand la
  commande arrive — statut « convertie », gardé pour la mesure.
*/
do $$ begin
  create type prospect_status as enum ('ouverte','rappelee','convertie','perdue');
exception when duplicate_object then null; end $$;

create table if not exists prospects (
  id            uuid primary key default gen_random_uuid(),
  piste_id      text unique not null,
  customer_name text not null default '',
  phone         text not null default '',
  wilaya        text not null default '',
  address       text not null default '',
  note          text not null default '',
  source        text not null default '',
  locale        text not null default 'fr',
  purchase_type purchase_type not null default 'demi_gros',
  total         numeric(12,2) not null default 0,
  pieces        int not null default 0,
  -- Le panier tel qu'il était : libellés figés, pas de jointure à refaire.
  items         jsonb not null default '[]'::jsonb,
  status        prospect_status not null default 'ouverte',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists prospects_updated_idx on prospects(updated_at desc);
create index if not exists prospects_status_idx  on prospects(status);

/*
  Aucune politique : comme pour les commandes, tout passe par la clé de service
  côté serveur. Une politique d'insertion publique laisserait n'importe qui
  écrire — ou lire les numéros de téléphone de toute la clientèle.
*/
alter table prospects enable row level security;

-- --------------------------------------------------------------- gestionnaires
/*
  Qui peut ouvrir le back-office.

  Une session Supabase valide ne suffit pas : si les inscriptions publiques sont
  ouvertes sur le projet — réglage par défaut — n'importe qui peut se créer un
  compte. Cette table dit lesquelles de ces adresses gèrent la boutique.

  Lue uniquement avec la clé de service, jamais depuis un navigateur. Aucune
  politique n'est posée : RLS active et sans politique ferme la table à la clé
  publique, ce qui est exactement le but.

  Pour ajouter une gestionnaire :
    1. Authentication → Users → Add user, avec son adresse et un mot de passe ;
    2. insert into admins (email) values ('adresse@exemple.dz');
*/
create table if not exists admins (
  email      text primary key,
  created_at timestamptz not null default now()
);
alter table admins enable row level security;

-- ------------------------------------------------------------ vérification
-- Doit renvoyer 11 tables. Si le compte est inférieur, relisez les erreurs
-- au-dessus : le script est idempotent, vous pouvez le relancer.
select count(*) as tables_creees
from information_schema.tables
where table_schema = 'public'
  and table_name in ('gammes','product_types','products','product_variants',
                     'orders','order_items','hero_slides','videos','site_settings',
                     'prospects','admins');
