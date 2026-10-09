create table public.enquiries (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 created_at timestamptz not null default now(),
 status text not null default 'new' check(status in ('new','contacted','closed')),
 payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<14000),
 kind text generated always as (payload->>'kind') stored,
 name text generated always as (payload->>'name') stored,
 email text generated always as (payload->>'email') stored,
 mobile text generated always as (payload->>'mobile') stored,
 product_name text generated always as (payload->>'productName') stored,
 constraint valid_kind check(kind in ('tds_download','product_enquiry','general_enquiry'))
);
create index enquiries_queue_idx on public.enquiries(status,created_at desc);
create index enquiries_kind_idx on public.enquiries(kind,created_at desc);
alter table public.enquiries enable row level security;
revoke all on public.enquiries from anon,authenticated;
grant select,insert,update on public.enquiries to service_role;

create table public.enquiry_rate_limits (
 key text primary key,
 count integer not null,
 expires_at timestamptz not null
);
create index enquiry_rate_expiry_idx on public.enquiry_rate_limits(expires_at);
alter table public.enquiry_rate_limits enable row level security;
revoke all on public.enquiry_rate_limits from anon,authenticated;

create or replace function public.record_enquiry(p_request_id uuid,p_payload jsonb,p_rate_key text)
returns uuid language plpgsql security definer set search_path='' as $$
declare existing public.enquiries; result_id uuid; hits integer;
begin
 -- Serialize retries of the same request so a lost response cannot create duplicate leads.
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into existing from public.enquiries where request_id=p_request_id;
 if found then
  if existing.payload <> p_payload then raise exception 'request_conflict'; end if;
  return existing.id;
 end if;
 delete from public.enquiry_rate_limits where expires_at < now();
 insert into public.enquiry_rate_limits(key,count,expires_at)
 values(p_rate_key,1,now()+interval '10 minutes')
 on conflict(key) do update set count=public.enquiry_rate_limits.count+1
 returning count into hits;
 if hits>8 then raise exception 'rate_limited'; end if;
 insert into public.enquiries(request_id,payload) values(p_request_id,p_payload) returning id into result_id;
 return result_id;
end $$;
revoke all on function public.record_enquiry(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.record_enquiry(uuid,jsonb,text) to service_role;

insert into storage.buckets(id,name,public) values('tds','tds',false) on conflict(id) do nothing;
-- No public storage policies: downloads receive a short-lived signed URL after capture.
