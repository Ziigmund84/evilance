-- Evilance — schéma Supabase (contenu du site, messages, médias, administrateurs)
-- Tout est préfixé « evilance » : le projet peut cohabiter avec d’autres sites.

-- Administrateurs : un compte Supabase Auth listé ici peut modifier le site.
create table if not exists public.evilance_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.evilance_admins enable row level security;

create or replace function public.evilance_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.evilance_admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.evilance_is_admin() from public;
grant execute on function public.evilance_is_admin() to authenticated;

create policy "evilance_admins: lecture de sa propre ligne" on public.evilance_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Contenu éditable : une ligne JSON par section du site.
create table if not exists public.evilance_content (
  key text primary key check (key ~ '^[a-z_]{2,40}$'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.evilance_content enable row level security;

create or replace function public.evilance_touch_content()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end $$;
drop trigger if exists evilance_content_touch on public.evilance_content;
create trigger evilance_content_touch before insert or update on public.evilance_content
  for each row execute function public.evilance_touch_content();

create policy "evilance_content: lecture publique" on public.evilance_content for select to anon, authenticated using (true);
create policy "evilance_content: ajout admin" on public.evilance_content for insert to authenticated with check ((select public.evilance_is_admin()));
create policy "evilance_content: modif admin" on public.evilance_content for update to authenticated using ((select public.evilance_is_admin())) with check ((select public.evilance_is_admin()));
create policy "evilance_content: suppression admin" on public.evilance_content for delete to authenticated using ((select public.evilance_is_admin()));

-- Messages du formulaire de contact : n'importe qui peut écrire, seuls les admins lisent.
create table if not exists public.evilance_messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  last_name text not null check (char_length(last_name) between 1 and 100),
  first_name text check (char_length(first_name) <= 100),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 30),
  profile text check (char_length(profile) <= 40),
  subject text check (char_length(subject) <= 200),
  message text not null check (char_length(message) between 1 and 4000),
  is_read boolean not null default false
);
alter table public.evilance_messages enable row level security;

create policy "evilance_messages: envoi public" on public.evilance_messages for insert to anon, authenticated with check (is_read = false);
create policy "evilance_messages: lecture admin" on public.evilance_messages for select to authenticated using ((select public.evilance_is_admin()));
create policy "evilance_messages: modif admin" on public.evilance_messages for update to authenticated using ((select public.evilance_is_admin())) with check ((select public.evilance_is_admin()));
create policy "evilance_messages: suppression admin" on public.evilance_messages for delete to authenticated using ((select public.evilance_is_admin()));

grant select on public.evilance_content to anon, authenticated;
grant insert, update, delete on public.evilance_content to authenticated;
grant insert on public.evilance_messages to anon, authenticated;
grant select, update, delete on public.evilance_messages to authenticated;

-- Stockage des images : lecture publique, écriture réservée aux admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evilance-media', 'evilance-media', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "evilance-media: ajout admin" on storage.objects for insert to authenticated with check (bucket_id = 'evilance-media' and (select public.evilance_is_admin()));
create policy "evilance-media: modif admin" on storage.objects for update to authenticated using (bucket_id = 'evilance-media' and (select public.evilance_is_admin()));
create policy "evilance-media: suppression admin" on storage.objects for delete to authenticated using (bucket_id = 'evilance-media' and (select public.evilance_is_admin()));
create policy "evilance-media: liste admin" on storage.objects for select to authenticated using (bucket_id = 'evilance-media' and (select public.evilance_is_admin()));

-- Donner les droits d’administration à un compte existant :
-- insert into public.evilance_admins (user_id) select id from auth.users where lower(email) = 'jerome.millier@yahoo.fr';

-- Articles du blog
create table if not exists public.evilance_posts (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title text not null check (char_length(title) between 1 and 200),
  excerpt text not null default '' check (char_length(excerpt) <= 600),
  content text not null default '',
  category text not null default '' check (char_length(category) <= 80),
  cover_url text not null default '',
  author text not null default 'Olivier',
  published boolean not null default true,
  published_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  words integer generated always as (coalesce(array_length(regexp_split_to_array(trim(regexp_replace(content, '<[^>]+>', ' ', 'g')), '\s+'), 1), 0)) stored
);
create index if not exists evilance_posts_published_idx on public.evilance_posts (published, published_at desc);
alter table public.evilance_posts enable row level security;
create or replace function public.evilance_touch_post()
returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end $$;
create trigger evilance_posts_touch before update on public.evilance_posts for each row execute function public.evilance_touch_post();
create policy "evilance_posts: lecture publique" on public.evilance_posts for select to anon, authenticated using (published or (select public.evilance_is_admin()));
create policy "evilance_posts: ajout admin" on public.evilance_posts for insert to authenticated with check ((select public.evilance_is_admin()));
create policy "evilance_posts: modif admin" on public.evilance_posts for update to authenticated using ((select public.evilance_is_admin())) with check ((select public.evilance_is_admin()));
create policy "evilance_posts: suppression admin" on public.evilance_posts for delete to authenticated using ((select public.evilance_is_admin()));
grant select on public.evilance_posts to anon, authenticated;
grant insert, update, delete on public.evilance_posts to authenticated;
