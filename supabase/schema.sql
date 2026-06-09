-- ARENA CJU / Arena Manager
-- Supabase schema aligned with the current frontend domain model.

create extension if not exists "pgcrypto";

do $$
begin
  create type public.arena_id as enum (
    'azul',
    'verde',
    'vermelho',
    'amarelo',
    'roxo',
    'laranja'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.arenado_status as enum (
    'ativo',
    'inativo',
    'pendente'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.import_file_type as enum (
    'csv',
    'xlsx',
    'xls'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.arenas (
  id public.arena_id primary key,
  nome text not null unique,
  cor text not null,
  ordem smallint not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  role text not null default 'admin',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_type public.import_file_type not null,
  total_rows integer not null default 0,
  total_imported integer not null default 0,
  total_errors integer not null default 0,
  default_arena_id public.arena_id,
  imported_by uuid references auth.users(id) on delete set null,
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
  arena_id public.arena_id not null references public.arenas(id),
  status public.arenado_status not null default 'pendente',
  import_batch_id uuid references public.import_batches(id) on delete set null,
  source_row jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.arenado_history (
  id uuid primary key default gen_random_uuid(),
  arenado_id uuid not null references public.arenados(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_arena_id public.arena_id,
  to_arena_id public.arena_id,
  from_status public.arenado_status,
  to_status public.arenado_status,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_arenados_arena_id on public.arenados (arena_id);
create index if not exists idx_arenados_status on public.arenados (status);
create index if not exists idx_arenados_nome on public.arenados using gin (to_tsvector('portuguese', coalesce(nome, '')));
create index if not exists idx_arenados_cpf on public.arenados (cpf);
create index if not exists idx_arenados_email on public.arenados (email);
create index if not exists idx_arenados_import_batch_id on public.arenados (import_batch_id);
create index if not exists idx_import_batches_imported_at on public.import_batches (imported_at desc);
create index if not exists idx_arenado_history_arenado_id on public.arenado_history (arenado_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_arenas_updated_at on public.arenas;
create trigger trg_arenas_updated_at
before update on public.arenas
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_arenados_updated_at on public.arenados;
create trigger trg_arenados_updated_at
before update on public.arenados
for each row execute function public.set_updated_at();

create or replace function public.seed_arenas()
returns void
language plpgsql
security definer
as $$
begin
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
end;
$$;

select public.seed_arenas();

create or replace function public.next_balanced_arena()
returns public.arena_id
language sql
stable
as $$
  select a.id
  from public.arenas a
  left join public.arenados ar
    on ar.arena_id = a.id
   and ar.deleted_at is null
  group by a.id, a.ordem
  order by count(ar.id) asc, a.ordem asc
  limit 1;
$$;

create or replace function public.assign_balanced_arena(default_arena public.arena_id default null)
returns public.arena_id
language plpgsql
stable
as $$
declare
  chosen_arena public.arena_id;
begin
  if default_arena is not null then
    return default_arena;
  end if;

  select public.next_balanced_arena() into chosen_arena;
  return coalesce(chosen_arena, 'azul'::public.arena_id);
end;
$$;

create or replace function public.register_arenado_event()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.arenado_history (
      arenado_id,
      event_type,
      to_arena_id,
      to_status,
      payload
    ) values (
      new.id,
      'created',
      new.arena_id,
      new.status,
      new.source_row
    );
    return new;
  end if;

  if new.arena_id is distinct from old.arena_id then
    insert into public.arenado_history (
      arenado_id,
      event_type,
      from_arena_id,
      to_arena_id,
      payload
    ) values (
      new.id,
      'arena_changed',
      old.arena_id,
      new.arena_id,
      jsonb_build_object('updated_at', now())
    );
  end if;

  if new.status is distinct from old.status then
    insert into public.arenado_history (
      arenado_id,
      event_type,
      from_status,
      to_status,
      payload
    ) values (
      new.id,
      'status_changed',
      old.status,
      new.status,
      jsonb_build_object('updated_at', now())
    );
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
alter table public.profiles enable row level security;
alter table public.import_batches enable row level security;
alter table public.arenados enable row level security;
alter table public.arenado_history enable row level security;

drop policy if exists "read arenas" on public.arenas;
create policy "read arenas"
on public.arenas
for select
to anon, authenticated
using (true);

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "read import batches" on public.import_batches;
create policy "read import batches"
on public.import_batches
for select
to anon, authenticated
using (true);

drop policy if exists "insert import batches" on public.import_batches;
create policy "insert import batches"
on public.import_batches
for insert
to anon, authenticated
with check (true);

drop policy if exists "read arenados" on public.arenados;
create policy "read arenados"
on public.arenados
for select
to anon, authenticated
using (deleted_at is null);

drop policy if exists "insert arenados" on public.arenados;
create policy "insert arenados"
on public.arenados
for insert
to anon, authenticated
with check (deleted_at is null);

drop policy if exists "update arenados" on public.arenados;
create policy "update arenados"
on public.arenados
for update
to anon, authenticated
using (deleted_at is null)
with check (deleted_at is null);

drop policy if exists "read arenado history" on public.arenado_history;
create policy "read arenado history"
on public.arenado_history
for select
to anon, authenticated
using (true);

comment on table public.arenas is 'Catálogo fixo das 6 arenas com cor visual própria.';
comment on table public.arenados is 'Cadastro principal dos arenados importados de Excel ou CSV.';
comment on table public.import_batches is 'Lote de importação para rastrear origem do arquivo e métricas.';
comment on table public.arenado_history is 'Histórico de movimentações, mudanças de status e auditoria.';