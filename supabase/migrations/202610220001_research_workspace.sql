-- Shared company records. Browser roles have no direct table or RPC access.
create table if not exists public.research_companies (
  id text primary key,
  position bigint generated always as identity unique,
  data jsonb not null,
  updated_at timestamptz,
  constraint company_data_id_matches check (data->>'id' = id)
);
create table if not exists public.research_settings (
  key text primary key,
  value text not null
);
alter table public.research_companies enable row level security;
alter table public.research_settings enable row level security;
revoke all on public.research_companies from anon, authenticated;
revoke all on public.research_settings from anon, authenticated;
grant all on public.research_companies to service_role;
grant all on public.research_settings to service_role;
grant usage, select on sequence public.research_companies_position_seq to service_role;

-- Atomic, idempotent initial import. Never overwrites previously saved records.
create or replace function public.seed_research_companies(initial_companies jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(5261022001);
  if exists (select 1 from public.research_settings where key = 'workbook-import-v1') then return; end if;
  insert into public.research_companies (id, data, updated_at)
    select company->>'id', company, nullif(company->>'updatedAt', '')::timestamptz
    from jsonb_array_elements(initial_companies) as imported(company)
    on conflict (id) do nothing;
  insert into public.research_settings (key, value) values ('workbook-import-v1', 'complete');
end;
$$;
revoke all on function public.seed_research_companies(jsonb) from public, anon, authenticated;
grant execute on function public.seed_research_companies(jsonb) to service_role;
