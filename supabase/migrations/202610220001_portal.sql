-- Phase 1 portal. No product rates, prices, users or seller identities are auto-approved.
create table public.portal_organisations(id uuid primary key default gen_random_uuid(),name text not null,brand text not null default 'TruBuild',created_at timestamptz not null default now());
create table public.portal_memberships(org_id uuid references public.portal_organisations(id),user_id uuid references auth.users(id),role text not null check(role in ('sales','manager','product_admin','pricing_admin','admin','dealer','marketing')),active boolean not null default true,territories text[] not null default '{}',primary key(org_id,user_id));
create index portal_memberships_user on public.portal_memberships(user_id,active);
create table public.portal_rules(id uuid primary key default gen_random_uuid(),org_id uuid not null references public.portal_organisations(id),version integer not null check(version>0),status text not null default 'draft' check(status in ('draft','published','retired')),definition jsonb not null,created_by uuid references auth.users(id),published_by uuid references auth.users(id),created_at timestamptz not null default now(),unique(org_id,id));
create table public.portal_prices(id uuid primary key default gen_random_uuid(),org_id uuid not null references public.portal_organisations(id),version integer not null,status text not null default 'draft' check(status in ('draft','published','retired')),definition jsonb not null,created_by uuid references auth.users(id),created_at timestamptz not null default now(),unique(org_id,id));
create table public.portal_contacts(id uuid primary key default gen_random_uuid(),org_id uuid not null references public.portal_organisations(id),match_key text not null,details jsonb not null,created_at timestamptz not null default now(),unique(org_id,id),unique(org_id,match_key));
create table public.portal_projects(id uuid primary key default gen_random_uuid(),org_id uuid not null references public.portal_organisations(id),contact_id uuid not null,name text not null,created_at timestamptz not null default now(),unique(org_id,id),foreign key(org_id,contact_id) references public.portal_contacts(org_id,id));
create table public.portal_estimates(id uuid primary key default gen_random_uuid(),org_id uuid not null references public.portal_organisations(id),project_id uuid not null,version integer not null default 1,snapshot jsonb not null,created_at timestamptz not null default now(),unique(org_id,id),foreign key(org_id,project_id) references public.portal_projects(org_id,id));
create table public.portal_leads(id uuid primary key default gen_random_uuid(),org_id uuid not null references public.portal_organisations(id),project_id uuid not null,contact_id uuid not null,estimate_id uuid not null,owner_id uuid,stage text not null default 'New' check(stage in ('New','Assigned','Contact attempted','Contacted','Qualified','Technical assessment','Quotation issued','Negotiation','Won','Lost','Nurture','Invalid','Duplicate','Unserviceable')),version integer not null default 1,context jsonb not null default '{}',next_action text,due_at timestamptz,created_at timestamptz not null default now(),unique(org_id,id),foreign key(org_id,project_id) references public.portal_projects(org_id,id),foreign key(org_id,contact_id) references public.portal_contacts(org_id,id),foreign key(org_id,estimate_id) references public.portal_estimates(org_id,id),foreign key(org_id,owner_id) references public.portal_memberships(org_id,user_id));
create index portal_leads_queue on public.portal_leads(org_id,owner_id,stage,created_at desc);
create index portal_leads_due on public.portal_leads(org_id,due_at) where stage not in ('Won','Lost','Invalid','Duplicate','Unserviceable');
create index portal_leads_contact on public.portal_leads(org_id,contact_id);
create index portal_leads_project on public.portal_leads(org_id,project_id);
create index portal_leads_estimate on public.portal_leads(org_id,estimate_id);
create index portal_projects_contact on public.portal_projects(org_id,contact_id);
create index portal_estimates_project on public.portal_estimates(org_id,project_id);
create table public.portal_activities(id uuid primary key default gen_random_uuid(),org_id uuid not null,lead_id uuid not null,actor uuid references auth.users(id),kind text not null,note text not null,manual boolean not null default true,created_at timestamptz not null default now(),foreign key(org_id,lead_id) references public.portal_leads(org_id,id));
create index portal_activities_lead on public.portal_activities(org_id,lead_id,created_at);
create table public.portal_tasks(id uuid primary key default gen_random_uuid(),org_id uuid not null,lead_id uuid not null,owner_id uuid,title text not null,due_at timestamptz,status text not null default 'open' check(status in ('open','done','cancelled')),outcome text,created_at timestamptz not null default now(),foreign key(org_id,lead_id) references public.portal_leads(org_id,id),foreign key(org_id,owner_id) references public.portal_memberships(org_id,user_id));
create index portal_tasks_lead on public.portal_tasks(org_id,lead_id);
create index portal_tasks_owner on public.portal_tasks(org_id,owner_id,due_at) where status='open';
create sequence public.portal_quote_numbers;
create table public.portal_quotations(id uuid primary key default gen_random_uuid(),org_id uuid not null,lead_id uuid not null,number text not null unique default ('TB-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.portal_quote_numbers')::text,6,'0')),revision integer not null,version integer not null default 1,status text not null default 'Draft' check(status in ('Draft','Pending approval','Approved','Issued','Accepted','Declined','Expired','Withdrawn')),snapshot jsonb not null,created_by uuid not null references auth.users(id),approved_by uuid references auth.users(id),issued_at timestamptz,expires_at timestamptz not null,token_hash text unique,link_expires_at timestamptz,change_reason text,created_at timestamptz not null default now(),unique(org_id,id),unique(org_id,lead_id,revision),foreign key(org_id,lead_id) references public.portal_leads(org_id,id));
create index portal_quotes_lead on public.portal_quotations(org_id,lead_id,revision desc);
create table public.portal_document_jobs(id uuid primary key default gen_random_uuid(),org_id uuid not null,quote_id uuid not null unique,status text not null default 'queued' check(status in ('queued','working','ready','failed')),attempts integer not null default 0,next_attempt_at timestamptz not null default now(),locked_at timestamptz,object_path text,checksum text,template_version text not null default '1',error_code text,foreign key(org_id,quote_id) references public.portal_quotations(org_id,id));
create index portal_jobs_queue on public.portal_document_jobs(status,next_attempt_at);
create table public.portal_audit(id bigint generated always as identity primary key,org_id uuid not null references public.portal_organisations(id),lead_id uuid,actor uuid,event text not null,details jsonb not null default '{}',created_at timestamptz not null default now(),foreign key(org_id,lead_id) references public.portal_leads(org_id,id));
create index portal_audit_lead on public.portal_audit(org_id,lead_id,created_at);
create table public.portal_requests(request_id uuid primary key,org_id uuid not null references public.portal_organisations(id),fingerprint text not null,response jsonb not null,created_at timestamptz not null default now());
create table public.portal_consents(id uuid primary key default gen_random_uuid(),org_id uuid not null,contact_id uuid not null,lead_id uuid not null,record jsonb not null,created_at timestamptz not null default now(),foreign key(org_id,contact_id) references public.portal_contacts(org_id,id),foreign key(org_id,lead_id) references public.portal_leads(org_id,id));
create index portal_consents_lead on public.portal_consents(org_id,lead_id);
create index portal_consents_contact on public.portal_consents(org_id,contact_id);

create function public.portal_role(p_org uuid) returns text language sql stable security definer set search_path='' as $$ select role from public.portal_memberships where org_id=p_org and user_id=(select auth.uid()) and active $$;
create function public.portal_can_lead(p_org uuid,p_lead uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.portal_leads l join public.portal_memberships m on m.org_id=l.org_id where l.org_id=p_org and l.id=p_lead and m.user_id=(select auth.uid()) and m.active and (m.role in ('admin','manager') or (m.role='sales' and l.owner_id=m.user_id))) $$;
-- Dealer and marketing roles receive no customer-record access in Phase 1.
do $$ declare t text; begin foreach t in array array['organisations','memberships','rules','prices','contacts','projects','estimates','leads','activities','tasks','quotations','document_jobs','audit','requests','consents'] loop execute format('alter table public.portal_%I enable row level security',t);execute format('revoke all on public.portal_%I from anon,authenticated',t);execute format('grant all on public.portal_%I to service_role',t);end loop;end $$;
grant usage,select on sequence public.portal_quote_numbers to service_role;
grant usage,select on sequence public.portal_audit_id_seq to service_role;
grant select on public.portal_memberships,public.portal_rules,public.portal_prices,public.portal_leads,public.portal_contacts,public.portal_projects,public.portal_estimates,public.portal_activities,public.portal_tasks,public.portal_quotations,public.portal_document_jobs,public.portal_audit to authenticated;
create policy own_memberships on public.portal_memberships for select to authenticated using(user_id=(select auth.uid()) and active);
create policy read_rules on public.portal_rules for select to authenticated using(public.portal_role(org_id) in ('admin','product_admin','manager','sales'));
create policy read_prices on public.portal_prices for select to authenticated using(public.portal_role(org_id) in ('admin','pricing_admin','manager','sales'));
create policy read_leads on public.portal_leads for select to authenticated using(public.portal_can_lead(org_id,id));
create policy read_contacts on public.portal_contacts for select to authenticated using(exists(select 1 from public.portal_leads l where l.org_id=portal_contacts.org_id and l.contact_id=portal_contacts.id and public.portal_can_lead(l.org_id,l.id)));
create policy read_projects on public.portal_projects for select to authenticated using(exists(select 1 from public.portal_leads l where l.org_id=portal_projects.org_id and l.project_id=portal_projects.id and public.portal_can_lead(l.org_id,l.id)));
create policy read_estimates on public.portal_estimates for select to authenticated using(exists(select 1 from public.portal_leads l where l.org_id=portal_estimates.org_id and l.estimate_id=portal_estimates.id and public.portal_can_lead(l.org_id,l.id)));
do $$ declare t text; begin foreach t in array array['activities','tasks','quotations','audit'] loop execute format('create policy read_assigned on public.portal_%I for select to authenticated using(public.portal_can_lead(org_id,lead_id))',t);end loop;end $$;
create policy read_jobs on public.portal_document_jobs for select to authenticated using(exists(select 1 from public.portal_quotations q where q.org_id=portal_document_jobs.org_id and q.id=portal_document_jobs.quote_id and public.portal_can_lead(q.org_id,q.lead_id)));

create function public.portal_capture(p_org uuid,p_request uuid,p_fingerprint text,p_contact jsonb,p_project text,p_estimate jsonb,p_source jsonb,p_rate text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.portal_requests;c uuid;pr uuid;e uuid;l uuid;owner uuid;hits int;result jsonb;contact_key text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 select * into r from public.portal_requests where request_id=p_request;
 if found then if r.org_id<>p_org or r.fingerprint<>p_fingerprint then raise exception 'request_conflict';end if;return r.response;end if;
 delete from public.enquiry_rate_limits where expires_at<now();
 insert into public.enquiry_rate_limits(key,count,expires_at) values('portal:'||p_rate,1,now()+interval '10 minutes') on conflict(key) do update set count=public.enquiry_rate_limits.count+1 returning count into hits;
 if hits>8 then raise exception 'rate_limited';end if;
 contact_key=case when p_contact->>'email'<>'' then 'email:'||(p_contact->>'email') else 'phone:'||(p_contact->>'phone') end;
 insert into public.portal_contacts(org_id,match_key,details) values(p_org,contact_key,p_contact) on conflict(org_id,match_key) do update set match_key=excluded.match_key returning id into c;
 insert into public.portal_projects(org_id,contact_id,name) values(p_org,c,p_project) returning id into pr;
 insert into public.portal_estimates(org_id,project_id,snapshot) values(p_org,pr,p_estimate) returning id into e;
 -- Explicit eligibility, no dealer city-wide access. Deterministic least-loaded eligible owner.
 select m.user_id into owner from public.portal_memberships m where m.org_id=p_org and m.active and m.role='sales' and (p_contact->>'pincode'=any(m.territories) or '*'=any(m.territories)) order by (select count(*) from public.portal_leads x where x.org_id=p_org and x.owner_id=m.user_id and x.stage not in ('Won','Lost')),m.user_id limit 1;
 insert into public.portal_leads(org_id,project_id,contact_id,estimate_id,owner_id,stage,context,next_action) values(p_org,pr,c,e,owner,case when owner is null then 'New' else 'Assigned' end,jsonb_build_object('source',p_source,'contactAtEnquiry',p_contact),'Set first-response deadline using agreed business hours') returning id into l;
 insert into public.portal_tasks(org_id,lead_id,owner_id,title) values(p_org,l,owner,case when owner is null then 'Routing exception: manager assignment required' else 'Confirm project and set first-response deadline' end);
 insert into public.portal_consents(org_id,contact_id,lead_id,record) values(p_org,c,l,p_contact-'name'-'email'-'phone');
 insert into public.portal_audit(org_id,lead_id,event,details) values(p_org,l,'enquiry_captured',jsonb_build_object('assigned',owner is not null));
 result=jsonb_build_object('id',l,'estimateId',e,'assignment',case when owner is null then 'review' else 'assigned' end);
 insert into public.portal_requests(request_id,org_id,fingerprint,response) values(p_request,p_org,p_fingerprint,result);return result;
end $$;

create function public.portal_mutate(p_org uuid,p_actor uuid,p_lead uuid,p_version int,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.portal_memberships;l public.portal_leads;owner uuid;s text;
begin
 select * into m from public.portal_memberships where org_id=p_org and user_id=p_actor and active;
 select * into l from public.portal_leads where org_id=p_org and id=p_lead for update;
 if m.role is null or l.id is null or not(m.role in ('admin','manager') or(m.role='sales' and l.owner_id=p_actor)) then raise exception 'access_denied';end if;
 if l.version<>p_version then raise exception 'edit_conflict';end if;
 if p_action='stage' then
  s=p_data->>'stage';
  if s='Qualified' and (coalesce(p_data->>'need','')='' or coalesce(p_data->>'timeline','')='' or coalesce(p_data->>'nextAction','')='' or coalesce(p_data->>'dueAt','')='') then raise exception 'qualification_incomplete';end if;
  if s='Negotiation' and not exists(select 1 from public.portal_quotations where org_id=p_org and lead_id=p_lead and status='Issued' and expires_at>now()) then raise exception 'quotation_required';end if;
  if s='Won' and (coalesce(p_data->>'orderReference','')='' or coalesce((p_data->>'orderValue')::numeric,0)<=0) then raise exception 'order_evidence_required';end if;
  if s='Lost' and coalesce(p_data->>'lostReason','') not in ('Price','Competitor','Timing','Project cancelled','Other') then raise exception 'lost_reason_required';end if;
  update public.portal_leads set stage=s,context=context||jsonb_build_object('outcome',p_data),next_action=case when s='Qualified' then p_data->>'nextAction' else next_action end,due_at=case when s='Qualified' then (p_data->>'dueAt')::timestamptz else due_at end where id=p_lead;
  if s='Qualified' then insert into public.portal_tasks(org_id,lead_id,owner_id,title,due_at) values(p_org,p_lead,l.owner_id,p_data->>'nextAction',(p_data->>'dueAt')::timestamptz);end if;
  if s in ('Won','Lost','Invalid','Duplicate','Unserviceable') then update public.portal_tasks set status='cancelled',outcome='Lead closed' where org_id=p_org and lead_id=p_lead and status='open';end if;
 elsif p_action='assign' then
  if m.role not in ('manager','admin') then raise exception 'access_denied';end if;
  owner=(p_data->>'ownerId')::uuid;
  if not exists(select 1 from public.portal_memberships where org_id=p_org and user_id=owner and active and role in ('sales','manager','admin')) then raise exception 'ineligible_owner';end if;
  if coalesce(p_data->>'reason','')='' then raise exception 'reason_required';end if;
  update public.portal_leads set owner_id=owner where id=p_lead;
  update public.portal_tasks set owner_id=owner where org_id=p_org and lead_id=p_lead and status='open';
 elsif p_action='activity' then
  if length(coalesce(p_data->>'note',''))<2 or length(p_data->>'note')>4000 then raise exception 'note_required';end if;
  insert into public.portal_activities(org_id,lead_id,actor,kind,note) values(p_org,p_lead,p_actor,coalesce(p_data->>'kind','Note'),p_data->>'note');
 elsif p_action='task' then
  if coalesce(p_data->>'title','')='' or coalesce(p_data->>'dueAt','')='' then raise exception 'task_details_required';end if;
  insert into public.portal_tasks(org_id,lead_id,owner_id,title,due_at) values(p_org,p_lead,l.owner_id,p_data->>'title',(p_data->>'dueAt')::timestamptz);
  update public.portal_leads set next_action=p_data->>'title',due_at=(p_data->>'dueAt')::timestamptz where id=p_lead;
 elsif p_action='complete_task' then
  if coalesce(p_data->>'outcome','')='' then raise exception 'outcome_required';end if;
  update public.portal_tasks set status='done',outcome=p_data->>'outcome' where org_id=p_org and lead_id=p_lead and id=(p_data->>'taskId')::uuid and status='open';
 else raise exception 'unsupported_action';end if;
 update public.portal_leads set version=version+1 where id=p_lead;
 insert into public.portal_audit(org_id,lead_id,actor,event,details) values(p_org,p_lead,p_actor,p_action,p_data);
 return jsonb_build_object('id',p_lead,'version',p_version+1);
end $$;

create function public.portal_quote_create(p_org uuid,p_actor uuid,p_lead uuid,p_version int,p_snapshot jsonb,p_expires timestamptz,p_reason text,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.portal_leads;m public.portal_memberships;q public.portal_quotations;r public.portal_requests;v int;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 select * into r from public.portal_requests where request_id=p_request;
 if found then if r.org_id<>p_org or r.fingerprint<>md5(p_actor::text||p_lead::text||p_expires::text||coalesce(p_reason,'')||coalesce(p_snapshot->>'discountBps','0')||coalesce(p_snapshot->>'chargesMinor','0')) then raise exception 'request_conflict';end if;return r.response;end if;
 select * into m from public.portal_memberships where org_id=p_org and user_id=p_actor and active;
 select * into l from public.portal_leads where org_id=p_org and id=p_lead for update;
 if m.role is null or l.id is null or not(m.role in ('admin','manager') or(m.role='sales' and l.owner_id=p_actor)) then raise exception 'access_denied';end if;
 if l.version<>p_version then raise exception 'edit_conflict';end if;
 if p_expires<=now() or p_expires>now()+interval '90 days' then raise exception 'invalid_validity';end if;
 select coalesce(max(revision),0)+1 into v from public.portal_quotations where org_id=p_org and lead_id=p_lead;
 if v>1 and coalesce(p_reason,'')='' then raise exception 'revision_reason_required';end if;
 insert into public.portal_quotations(org_id,lead_id,revision,snapshot,created_by,expires_at,change_reason,status) values(p_org,p_lead,v,p_snapshot,p_actor,p_expires,p_reason,case when (p_snapshot->>'needsApproval')::boolean then 'Pending approval' else 'Draft' end) returning * into q;
 update public.portal_leads set version=version+1 where id=p_lead;
 insert into public.portal_audit(org_id,lead_id,actor,event,details) values(p_org,p_lead,p_actor,'quotation_revision_created',jsonb_build_object('quote',q.id,'revision',v));
 insert into public.portal_requests(request_id,org_id,fingerprint,response) values(p_request,p_org,md5(p_actor::text||p_lead::text||p_expires::text||coalesce(p_reason,'')||coalesce(p_snapshot->>'discountBps','0')||coalesce(p_snapshot->>'chargesMinor','0')),jsonb_build_object('id',q.id,'number',q.number,'revision',v));
 return jsonb_build_object('id',q.id,'number',q.number,'revision',v);
end $$;
create function public.portal_quote_transition(p_org uuid,p_actor uuid,p_quote uuid,p_version int,p_action text,p_token_hash text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.portal_quotations;m public.portal_memberships;l public.portal_leads;
begin
 select * into q from public.portal_quotations where org_id=p_org and id=p_quote for update;
 select * into m from public.portal_memberships where org_id=p_org and user_id=p_actor and active;
 select * into l from public.portal_leads where org_id=p_org and id=q.lead_id;
 if q.id is null or m.role is null or not(m.role in ('admin','manager') or(m.role='sales' and l.owner_id=p_actor)) then raise exception 'access_denied';end if;
 if q.version<>p_version then raise exception 'edit_conflict';end if;
 if p_action='approve' then
  if m.role not in ('admin','manager') or q.created_by=p_actor or q.status<>'Pending approval' then raise exception 'approval_not_permitted';end if;
  update public.portal_quotations set status='Approved',approved_by=p_actor,version=version+1 where id=q.id;
 elsif p_action='issue' then
  if q.status not in ('Draft','Approved') or ((q.snapshot->>'needsApproval')::boolean and q.approved_by is null) or q.expires_at<=now() or p_token_hash is null then raise exception 'issue_blocked';end if;
  update public.portal_quotations set status='Issued',issued_at=now(),token_hash=p_token_hash,link_expires_at=expires_at,version=version+1 where id=q.id;
  insert into public.portal_document_jobs(org_id,quote_id) values(p_org,q.id) on conflict(quote_id) do nothing;
 elsif p_action='withdraw' then update public.portal_quotations set status='Withdrawn',token_hash=null,version=version+1 where id=q.id;
 elsif p_action='retry_pdf' then update public.portal_document_jobs set status='queued',next_attempt_at=now(),error_code=null where quote_id=q.id and status='failed' and attempts<5;
 else raise exception 'unsupported_action';end if;
 insert into public.portal_audit(org_id,lead_id,actor,event,details) values(p_org,q.lead_id,p_actor,p_action,jsonb_build_object('quote',q.id));return jsonb_build_object('id',q.id);
end $$;
create function public.portal_customer_action(p_hash text,p_revision int,p_action text,p_note text) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.portal_quotations;
begin
 select * into q from public.portal_quotations where token_hash=p_hash for update;
 if q.id is null or q.link_expires_at<=now() or q.expires_at<=now() or q.status<>'Issued' or q.revision<>p_revision then raise exception 'link_unavailable';end if;
 if exists(select 1 from public.portal_quotations where lead_id=q.lead_id and org_id=q.org_id and revision>q.revision and status in ('Issued','Accepted')) then raise exception 'new_revision_available';end if;
 if p_action in ('revision','callback') and exists(select 1 from public.portal_audit where org_id=q.org_id and lead_id=q.lead_id and event='customer_'||p_action and details->>'quote'=q.id::text) then return jsonb_build_object('id',q.id);end if;
 if p_action='accept' then update public.portal_quotations set status='Accepted',version=version+1 where id=q.id;
 elsif p_action='decline' then update public.portal_quotations set status='Declined',version=version+1 where id=q.id;
 elsif p_action in ('revision','callback') then insert into public.portal_tasks(org_id,lead_id,owner_id,title) select org_id,id,owner_id,'Customer requested '||p_action||': '||left(p_note,2000) from public.portal_leads where id=q.lead_id;
 else raise exception 'unsupported_action';end if;
 insert into public.portal_audit(org_id,lead_id,event,details) values(q.org_id,q.lead_id,'customer_'||p_action,jsonb_build_object('quote',q.id,'revision',q.revision,'identity','scoped bearer link','purchase_intent_only',true));return jsonb_build_object('id',q.id);
end $$;
create function public.portal_claim_pdf() returns setof public.portal_document_jobs language plpgsql security definer set search_path='' as $$
begin update public.portal_document_jobs set status='failed',error_code='worker_retry_limit' where status='working' and attempts>=5 and locked_at<now()-interval '5 minutes'; return query update public.portal_document_jobs set status='working',attempts=attempts+1,locked_at=now() where id in(select id from public.portal_document_jobs where (status='queued' and next_attempt_at<=now() or status='working' and locked_at<now()-interval '5 minutes') and attempts<5 order by next_attempt_at for update skip locked limit 3) returning *;end $$;
create function public.portal_immutable_snapshot() returns trigger language plpgsql set search_path='' as $$ begin if old.snapshot is distinct from new.snapshot then raise exception 'immutable_snapshot';end if;return new;end $$;
create trigger portal_quote_snapshot before update on public.portal_quotations for each row execute function public.portal_immutable_snapshot();
create trigger portal_estimate_snapshot before update on public.portal_estimates for each row execute function public.portal_immutable_snapshot();
-- RPCs are private server orchestration entrypoints. Auth users get no direct write grants.
do $$ declare f record; begin for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace and proname like 'portal_%' loop execute 'revoke all on function '||f.signature||' from public,anon,authenticated';execute 'grant execute on function '||f.signature||' to service_role';end loop;end $$;
grant execute on function public.portal_role(uuid),public.portal_can_lead(uuid,uuid) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('portal-documents','portal-documents',false,10485760,array['application/pdf']) on conflict(id) do nothing;
create function public.portal_save_config(p_org uuid,p_actor uuid,p_kind text,p_definition jsonb,p_status text) returns uuid language plpgsql security definer set search_path='' as $$
declare r text;result uuid;
begin
 select role into r from public.portal_memberships where org_id=p_org and user_id=p_actor and active;
 if p_status not in ('draft','published') then raise exception 'invalid_status';end if;
 if p_kind='rule' and r in ('admin','product_admin') then insert into public.portal_rules(org_id,version,status,definition,created_by,published_by) values(p_org,(p_definition->>'version')::int,p_status,p_definition,p_actor,case when p_status='published' then p_actor end) returning id into result;
 elsif p_kind='price' and r in ('admin','pricing_admin') then insert into public.portal_prices(org_id,version,status,definition,created_by) values(p_org,(p_definition->>'version')::int,p_status,p_definition,p_actor) returning id into result;
 else raise exception 'access_denied';end if;
 insert into public.portal_audit(org_id,actor,event,details) values(p_org,p_actor,'configuration_'||p_status,jsonb_build_object('kind',p_kind,'id',result));return result;
end $$;
revoke all on function public.portal_save_config(uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.portal_save_config(uuid,uuid,text,jsonb,text) to service_role;
