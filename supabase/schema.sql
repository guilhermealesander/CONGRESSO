-- ARENA CJU / Arena Manager - production-oriented Supabase schema
-- Run in Supabase SQL editor after creating the project.
-- Create users in Authentication > Users, then link them in public.team_users.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.arenas (
  id text primary key,
  nome text not null unique,
  cor text not null check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  ordem integer not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_type text not null check (file_type in ('csv', 'xlsx', 'xls')),
  total_rows integer not null default 0,
  total_imported integer not null default 0,
  total_errors integer not null default 0,
  default_arena_id text,
  imported_by uuid references auth.users(id) on delete set null default auth.uid(),
  imported_at timestamptz not null default now(),
  notes text
);

create table if not exists public.arenados (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  cpf text,
  email text,
  telefone text,
  cidade text,
  estado text,
  profissao text,
  idade integer check (idade is null or idade between 0 and 130),
  arena_id text not null references public.arenas(id) on update cascade,
  status text not null default 'pendente' check (status in ('ativo', 'inativo', 'pendente')),
  import_batch_id uuid references public.import_batches(id) on delete set null,
  source_row jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.arenado_history (
  id uuid primary key default gen_random_uuid(),
  arenado_id uuid not null references public.arenados(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null default auth.uid(),
  event_type text not null,
  from_arena_id text,
  to_arena_id text,
  from_status text,
  to_status text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.team_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  telefone text,
  role text not null check (role in ('admin', 'lider', 'colaborador')),
  arena_id text references public.arenas(id) on update cascade on delete set null,
  ativo boolean not null default true,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration compatibility for older prototype schemas using enum-based arenas/password_hash.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'arenas' and column_name = 'id' and udt_name = 'arena_id'
  ) then
    alter table public.arenas alter column id type text using id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'arenados' and column_name = 'arena_id' and udt_name = 'arena_id'
  ) then
    alter table public.arenados alter column arena_id type text using arena_id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'import_batches' and column_name = 'default_arena_id' and udt_name = 'arena_id'
  ) then
    alter table public.import_batches alter column default_arena_id type text using default_arena_id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_users' and column_name = 'arena_id' and udt_name = 'arena_id'
  ) then
    alter table public.team_users alter column arena_id type text using arena_id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'arenado_history' and column_name = 'from_arena_id' and udt_name = 'arena_id'
  ) then
    alter table public.arenado_history alter column from_arena_id type text using from_arena_id::text;
    alter table public.arenado_history alter column to_arena_id type text using to_arena_id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_users' and column_name = 'password_hash'
  ) then
    alter table public.team_users alter column password_hash drop not null;
  end if;
end $$;

alter table public.import_batches
  drop constraint if exists import_batches_default_arena_id_fkey,
  add constraint import_batches_default_arena_id_fkey
    foreign key (default_arena_id) references public.arenas(id) on update cascade on delete set null;

insert into public.arenas (id, nome, cor, ordem)
values
  ('azul', 'Arena Azul', '#3b82f6', 1),
  ('verde', 'Arena Verde', '#22c55e', 2),
  ('vermelho', 'Arena Vermelha', '#ef4444', 3),
  ('amarelo', 'Arena Amarela', '#eab308', 4),
  ('roxo', 'Arena Roxa', '#a855f7', 5),
  ('laranja', 'Arena Laranja', '#f97316', 6)
on conflict (id) do update
  set nome = excluded.nome,
      cor = excluded.cor,
      ordem = excluded.ordem,
      updated_at = now();

create index if not exists idx_arenados_arena_id on public.arenados (arena_id);
create index if not exists idx_arenados_status on public.arenados (status);
create index if not exists idx_arenados_cpf on public.arenados (cpf);
create index if not exists idx_arenados_email on public.arenados (email);
create index if not exists idx_arenados_import_batch_id on public.arenados (import_batch_id);
create index if not exists idx_arenados_nome on public.arenados using gin (to_tsvector('portuguese', coalesce(nome, '')));
create index if not exists idx_import_batches_imported_at on public.import_batches (imported_at desc);
create index if not exists idx_team_users_auth_user_id on public.team_users (auth_user_id);
create index if not exists idx_team_users_role on public.team_users (role);
create index if not exists idx_team_users_arena_id on public.team_users (arena_id);
create index if not exists idx_arenado_history_arenado_id on public.arenado_history (arenado_id, created_at desc);

drop trigger if exists trg_arenas_updated_at on public.arenas;
create trigger trg_arenas_updated_at
before update on public.arenas
for each row execute function public.set_updated_at();

drop trigger if exists trg_arenados_updated_at on public.arenados;
create trigger trg_arenados_updated_at
before update on public.arenados
for each row execute function public.set_updated_at();

drop trigger if exists trg_team_users_updated_at on public.team_users;
create trigger trg_team_users_updated_at
before update on public.team_users
for each row execute function public.set_updated_at();

create or replace function public.current_team_user()
returns public.team_users
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.team_users
  where auth_user_id = auth.uid()
    and ativo = true
  limit 1;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.current_team_user();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false);
$$;

create or replace function public.can_access_arena(target_arena text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_admin(), false)
      or exists (
        select 1
        from public.team_users tu
        where tu.auth_user_id = auth.uid()
          and tu.ativo = true
          and tu.arena_id = target_arena
      );
$$;

create or replace function public.bootstrap_first_admin(
  target_auth_user_id uuid,
  target_nome text,
  target_email text,
  target_telefone text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.team_users where role = 'admin' and ativo = true) then
    raise exception 'Admin already exists';
  end if;

  insert into public.team_users (auth_user_id, nome, email, telefone, role, arena_id, ativo, observacoes)
  values (target_auth_user_id, target_nome, target_email, target_telefone, 'admin', null, true, 'Bootstrap admin');
end;
$$;

create or replace function public.register_arenado_event()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.arenado_history (arenado_id, event_type, to_arena_id, to_status, payload)
    values (new.id, 'created', new.arena_id, new.status, new.source_row);
    return new;
  end if;

  if new.arena_id is distinct from old.arena_id then
    insert into public.arenado_history (arenado_id, event_type, from_arena_id, to_arena_id, payload)
    values (new.id, 'arena_changed', old.arena_id, new.arena_id, jsonb_build_object('updated_at', now()));
  end if;

  if new.status is distinct from old.status then
    insert into public.arenado_history (arenado_id, event_type, from_status, to_status, payload)
    values (new.id, 'status_changed', old.status, new.status, jsonb_build_object('updated_at', now()));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_arenados_history on public.arenados;
create trigger trg_arenados_history
after insert or update on public.arenados
for each row execute function public.register_arenado_event();

create or replace view public.dashboard_totals as
select
  count(*) filter (where deleted_at is null) as total_arenados,
  count(*) filter (where status = 'ativo' and deleted_at is null) as total_ativos,
  count(*) filter (where status = 'pendente' and deleted_at is null) as total_pendentes,
  count(*) filter (where status = 'inativo' and deleted_at is null) as total_inativos,
  max(created_at) as ultima_importacao
from public.arenados;

create or replace view public.dashboard_by_arena as
select
  a.id as arena_id,
  a.nome as arena_nome,
  a.cor as arena_cor,
  count(ar.id) filter (where ar.deleted_at is null) as total_arenados,
  count(ar.id) filter (where ar.status = 'ativo' and ar.deleted_at is null) as total_ativos,
  count(ar.id) filter (where ar.status = 'pendente' and ar.deleted_at is null) as total_pendentes,
  count(ar.id) filter (where ar.status = 'inativo' and ar.deleted_at is null) as total_inativos
from public.arenas a
left join public.arenados ar on ar.arena_id = a.id
group by a.id, a.nome, a.cor, a.ordem
order by a.ordem;

alter table public.arenas enable row level security;
alter table public.import_batches enable row level security;
alter table public.arenados enable row level security;
alter table public.arenado_history enable row level security;
alter table public.team_users enable row level security;

drop policy if exists arenas_select on public.arenas;
create policy arenas_select on public.arenas
for select to authenticated
using (true);

drop policy if exists arenas_admin_insert on public.arenas;
create policy arenas_admin_insert on public.arenas
for insert to authenticated
with check (public.is_admin());

drop policy if exists arenas_admin_update on public.arenas;
create policy arenas_admin_update on public.arenas
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists arenas_admin_delete on public.arenas;
create policy arenas_admin_delete on public.arenas
for delete to authenticated
using (public.is_admin());

drop policy if exists team_users_select on public.team_users;
create policy team_users_select on public.team_users
for select to authenticated
using (public.is_admin() or auth_user_id = auth.uid());

drop policy if exists team_users_admin_insert on public.team_users;
create policy team_users_admin_insert on public.team_users
for insert to authenticated
with check (public.is_admin());

drop policy if exists team_users_admin_update on public.team_users;
create policy team_users_admin_update on public.team_users
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists team_users_admin_delete on public.team_users;
create policy team_users_admin_delete on public.team_users
for delete to authenticated
using (public.is_admin());

drop policy if exists import_batches_select on public.import_batches;
create policy import_batches_select on public.import_batches
for select to authenticated
using (public.is_admin());

drop policy if exists import_batches_admin_insert on public.import_batches;
create policy import_batches_admin_insert on public.import_batches
for insert to authenticated
with check (public.is_admin());

drop policy if exists arenados_select on public.arenados;
create policy arenados_select on public.arenados
for select to authenticated
using (deleted_at is null and public.can_access_arena(arena_id));

drop policy if exists arenados_admin_insert on public.arenados;
create policy arenados_admin_insert on public.arenados
for insert to authenticated
with check (public.is_admin() and deleted_at is null);

drop policy if exists arenados_admin_update on public.arenados;
create policy arenados_admin_update on public.arenados
for update to authenticated
using (deleted_at is null and public.is_admin())
with check (deleted_at is null and public.is_admin());

drop policy if exists arenado_history_select on public.arenado_history;
create policy arenado_history_select on public.arenado_history
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.arenados a
    where a.id = arenado_id
      and public.can_access_arena(a.arena_id)
  )
);

grant execute on function public.bootstrap_first_admin(uuid, text, text, text) to authenticated;

comment on table public.arenas is 'Catalogo dinamico de arenas e suas cores.';
comment on table public.arenados is 'Cadastro principal dos arenados importados de Excel ou CSV.';
comment on table public.import_batches is 'Lote de importacao para rastrear origem do arquivo e metricas.';
comment on table public.arenado_history is 'Historico de movimentacoes, mudancas de status e auditoria.';
comment on table public.team_users is 'Vincula usuarios do Supabase Auth aos papeis do sistema.';
