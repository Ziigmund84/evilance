-- Evilance — schéma Supabase (contenu du site, messages, médias, administrateurs)

-- Administrateurs : un compte Supabase Auth listé ici peut modifier le site.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admins: lecture de sa propre ligne" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Contenu éditable : une ligne JSON par section du site.
create table if not exists public.site_content (
  key text primary key check (key ~ '^[a-z_]{2,40}$'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.site_content enable row level security;

create or replace function public.touch_site_content()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end $$;
drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch before insert or update on public.site_content
  for each row execute function public.touch_site_content();

create policy "contenu: lecture publique" on public.site_content for select to anon, authenticated using (true);
create policy "contenu: ajout admin" on public.site_content for insert to authenticated with check ((select public.is_admin()));
create policy "contenu: modif admin" on public.site_content for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "contenu: suppression admin" on public.site_content for delete to authenticated using ((select public.is_admin()));

-- Messages du formulaire de contact : n'importe qui peut écrire, seuls les admins lisent.
create table if not exists public.messages (
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
alter table public.messages enable row level security;

create policy "messages: envoi public" on public.messages for insert to anon, authenticated with check (is_read = false);
create policy "messages: lecture admin" on public.messages for select to authenticated using ((select public.is_admin()));
create policy "messages: modif admin" on public.messages for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "messages: suppression admin" on public.messages for delete to authenticated using ((select public.is_admin()));

grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
grant insert on public.messages to anon, authenticated;
grant select, update, delete on public.messages to authenticated;

-- Stockage des images : lecture publique, écriture réservée aux admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "media: ajout admin" on storage.objects for insert to authenticated with check (bucket_id = 'media' and (select public.is_admin()));
create policy "media: modif admin" on storage.objects for update to authenticated using (bucket_id = 'media' and (select public.is_admin()));
create policy "media: suppression admin" on storage.objects for delete to authenticated using (bucket_id = 'media' and (select public.is_admin()));
create policy "media: liste admin" on storage.objects for select to authenticated using (bucket_id = 'media' and (select public.is_admin()));
