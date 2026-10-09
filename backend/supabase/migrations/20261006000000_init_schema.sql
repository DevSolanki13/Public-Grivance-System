-- JanSewa Public Grievance Redressal System — core schema
--
-- Design notes
--   * Every workflow transition (assign, resolve, verify, reject) goes through a
--     SECURITY DEFINER function that checks the caller's role and the current
--     status. Clients have NO direct UPDATE privilege on grievances, so the
--     lifecycle rules cannot be bypassed from the browser.
--   * Row Level Security scopes reads: citizens see their own cases, officers
--     see cases assigned to them, department heads see their department, admins
--     see everything. Anonymous visitors only get the anonymised transparency
--     feed exposed by public_grievance_feed().

create extension if not exists pgcrypto with schema extensions;

-- ─── Enums ──────────────────────────────────────────────────────────────────
create type public.app_role as enum ('citizen', 'officer', 'department_head', 'admin');

create type public.grievance_status as enum (
  'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Reopened', 'Rejected'
);

create type public.grievance_priority as enum ('Low', 'Medium', 'High', 'Critical');

-- ─── Reference data ─────────────────────────────────────────────────────────
create table public.departments (
  name text primary key,
  description text not null default ''
);

create table public.categories (
  name text primary key,
  department text not null references public.departments (name) on update cascade
);

-- ─── Profiles (1:1 with auth.users) ─────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  role public.app_role not null default 'citizen',
  department text references public.departments (name) on update cascade,
  designation text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Grievances ─────────────────────────────────────────────────────────────
create sequence public.complaint_number_seq start 1001;

create table public.grievances (
  id uuid primary key default gen_random_uuid(),
  complaint_id text not null unique,
  citizen_id uuid not null references public.profiles (id) on delete cascade,
  citizen_name text not null default '',
  citizen_email text not null default '',
  category text not null references public.categories (name) on update cascade,
  subcategory text not null default '',
  subject text not null check (char_length(btrim(subject)) between 3 and 200),
  description text not null check (char_length(btrim(description)) between 10 and 5000),
  location text not null check (char_length(btrim(location)) between 3 and 500),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  priority public.grievance_priority not null default 'Medium',
  department text references public.departments (name) on update cascade,
  assigned_officer_id uuid references public.profiles (id) on delete set null,
  assigned_officer_name text,
  status public.grievance_status not null default 'Submitted',
  admin_remark text not null default '',
  rejection_reason text,
  image_url text not null default '' check (image_url = '' or image_url ~ '^https?://'),
  resolution_image_url text not null default '' check (resolution_image_url = '' or resolution_image_url ~ '^https?://'),
  rating smallint check (rating between 1 and 5),
  feedback_comment text,
  reopen_reason text,
  reopen_image_url text check (reopen_image_url is null or reopen_image_url = '' or reopen_image_url ~ '^https?://'),
  reopened_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  rejected_at timestamptz,
  reopened_at timestamptz
);

create index grievances_citizen_idx on public.grievances (citizen_id);
create index grievances_officer_idx on public.grievances (assigned_officer_id);
create index grievances_department_idx on public.grievances (department);
create index grievances_status_idx on public.grievances (status);
create index grievances_created_idx on public.grievances (created_at desc);

-- Timeline of every lifecycle event for a grievance.
create table public.grievance_events (
  id bigint generated always as identity primary key,
  grievance_id uuid not null references public.grievances (id) on delete cascade,
  status public.grievance_status not null,
  remark text not null default '',
  actor_id uuid references public.profiles (id) on delete set null,
  actor_name text not null default '',
  created_at timestamptz not null default now()
);

create index grievance_events_grievance_idx on public.grievance_events (grievance_id, created_at);

-- ─── Notifications ──────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  grievance_id uuid references public.grievances (id) on delete cascade,
  link text,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ─── Helper functions ───────────────────────────────────────────────────────
-- SECURITY DEFINER so RLS policies can look up the caller's profile without
-- recursing into the profiles policies.
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.is_active
$$;

create or replace function public.current_department()
returns text
language sql stable security definer set search_path = ''
as $$
  select p.department from public.profiles p where p.id = auth.uid() and p.is_active
$$;

-- Resolution-time target per priority, used for SLA analytics.
create or replace function public.sla_hours(p public.grievance_priority)
returns integer
language sql immutable set search_path = ''
as $$
  select case p
    when 'Critical' then 24
    when 'High' then 48
    when 'Medium' then 72
    else 168
  end
$$;

create or replace function public.notify_user(
  p_user_id uuid, p_title text, p_message text, p_grievance_id uuid, p_link text, p_type text
)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, title, message, grievance_id, link, type)
  select p_user_id, p_title, p_message, p_grievance_id, p_link, p_type
  where p_user_id is not null
$$;

-- Notify every active department head of a department (and optionally admins).
create or replace function public.notify_department(
  p_department text, p_title text, p_message text, p_grievance_id uuid, p_type text, p_include_admins boolean default false
)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, title, message, grievance_id, link, type)
  select p.id, p_title, p_message, p_grievance_id, '/admin/grievance/' || p_grievance_id, p_type
  from public.profiles p
  where p.is_active
    and ((p.role = 'department_head' and p.department = p_department)
         or (p_include_admins and p.role = 'admin'))
$$;

revoke execute on function public.notify_user(uuid, text, text, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.notify_department(text, text, text, uuid, text, boolean) from public, anon, authenticated;

create or replace function public.log_grievance_event(p_grievance_id uuid, p_status public.grievance_status, p_remark text)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.grievance_events (grievance_id, status, remark, actor_id, actor_name)
  values (
    p_grievance_id, p_status, coalesce(p_remark, ''), auth.uid(),
    coalesce((select name from public.profiles where id = auth.uid()), 'System')
  )
$$;

revoke execute on function public.log_grievance_event(uuid, public.grievance_status, text) from public, anon, authenticated;

-- ─── Triggers ───────────────────────────────────────────────────────────────
-- Create a citizen profile whenever someone signs up. Role is ALWAYS citizen;
-- staff roles can only be granted by an admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    'citizen'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own name/phone, but never their role, department or
-- active flag. Only admins (or server-side code with no end-user JWT) may.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if auth.uid() is not null
     and (new.role, new.department, new.is_active, new.email) is distinct from (old.role, old.department, old.is_active, old.email)
     and public.current_app_role() is distinct from 'admin' then
    raise exception 'Only administrators can change role, department, email or status'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Normalise a newly filed grievance. When the insert comes from an end user we
-- overwrite every server-controlled column so a crafted request cannot, e.g.,
-- file a case as already "Closed" or pre-assign an officer.
create or replace function public.prepare_new_grievance()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  if new.complaint_id is null or auth.uid() is not null then
    new.complaint_id := 'GRV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.complaint_number_seq')::text, 5, '0');
  end if;

  if auth.uid() is not null then
    -- citizen_id is left as sent: the RLS insert policy rejects any value
    -- other than auth.uid(), so spoofed filings fail loudly.
    select * into v_profile from public.profiles where id = auth.uid();
    new.citizen_name := coalesce(nullif(v_profile.name, ''), 'Citizen');
    new.citizen_email := coalesce(v_profile.email, '');
    new.status := 'Submitted';
    new.priority := coalesce(new.priority, 'Medium');
    new.department := (select c.department from public.categories c where c.name = new.category);
    new.assigned_officer_id := null;
    new.assigned_officer_name := null;
    new.admin_remark := '';
    new.rejection_reason := null;
    new.resolution_image_url := '';
    new.rating := null;
    new.feedback_comment := null;
    new.reopen_reason := null;
    new.reopen_image_url := null;
    new.reopened_count := 0;
    new.created_at := now();
    new.updated_at := now();
    new.resolved_at := null;
    new.closed_at := null;
    new.rejected_at := null;
    new.reopened_at := null;
  elsif new.department is null then
    new.department := (select c.department from public.categories c where c.name = new.category);
  end if;

  new.subject := btrim(new.subject);
  new.description := btrim(new.description);
  new.location := btrim(new.location);
  return new;
end;
$$;

create trigger grievances_prepare_insert
  before insert on public.grievances
  for each row execute function public.prepare_new_grievance();

create or replace function public.after_grievance_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.grievance_events (grievance_id, status, remark, actor_id, actor_name, created_at)
  values (new.id, 'Submitted', 'Grievance registered by citizen.', new.citizen_id, new.citizen_name, new.created_at);

  if auth.uid() is not null then
    perform public.notify_user(
      new.citizen_id, 'Grievance submitted',
      'Your grievance ' || new.complaint_id || ' has been registered and sent for triage.',
      new.id, '/citizen/grievance/' || new.id, 'info');
    perform public.notify_department(
      new.department, 'New grievance filed',
      'New case ' || new.complaint_id || ' (' || new.category || ') at ' || new.location || ' is awaiting assignment.',
      new.id, 'assignment', true);
  end if;
  return new;
end;
$$;

create trigger grievances_after_insert
  after insert on public.grievances
  for each row execute function public.after_grievance_insert();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger grievances_touch_updated_at
  before update on public.grievances
  for each row execute function public.touch_updated_at();

-- ─── Workflow RPCs ──────────────────────────────────────────────────────────
-- Department head / admin assigns (or re-assigns) a field officer.
create or replace function public.assign_grievance(
  p_grievance_id uuid,
  p_department text,
  p_officer_id uuid,
  p_priority public.grievance_priority default null,
  p_remark text default null
)
returns public.grievances
language plpgsql security definer set search_path = ''
as $$
declare
  v_role public.app_role := public.current_app_role();
  v_g public.grievances;
  v_officer public.profiles;
  v_remark text;
begin
  select * into v_g from public.grievances where id = p_grievance_id for update;
  if not found then
    raise exception 'Grievance not found' using errcode = 'P0002';
  end if;

  if v_role is null or not (v_role = 'admin' or (v_role = 'department_head' and v_g.department = public.current_department())) then
    raise exception 'You are not allowed to assign this grievance' using errcode = '42501';
  end if;

  if v_g.status not in ('Submitted', 'Under Review', 'In Progress', 'Reopened') then
    raise exception 'A % grievance cannot be assigned', v_g.status using errcode = '22023';
  end if;

  if not exists (select 1 from public.departments where name = p_department) then
    raise exception 'Unknown department %', p_department using errcode = '22023';
  end if;

  if v_role = 'department_head' and p_department <> public.current_department() then
    raise exception 'Department heads can only assign within their own department' using errcode = '42501';
  end if;

  select * into v_officer from public.profiles where id = p_officer_id;
  if not found or v_officer.role <> 'officer' or not v_officer.is_active then
    raise exception 'Selected user is not an active field officer' using errcode = '22023';
  end if;
  if v_officer.department is distinct from p_department then
    raise exception 'Officer % does not belong to %', v_officer.name, p_department using errcode = '22023';
  end if;

  v_remark := coalesce(nullif(btrim(p_remark), ''), 'Assigned to ' || v_officer.name || ' for on-site inspection and repair.');

  update public.grievances set
    department = p_department,
    assigned_officer_id = v_officer.id,
    assigned_officer_name = v_officer.name,
    priority = coalesce(p_priority, priority),
    status = case when status = 'Reopened' then 'Reopened'::public.grievance_status else 'In Progress'::public.grievance_status end,
    admin_remark = v_remark
  where id = p_grievance_id
  returning * into v_g;

  -- Timeline: who it went to, plus the dispatcher's own instructions if any.
  perform public.log_grievance_event(v_g.id, v_g.status,
    'Assigned to ' || v_officer.name || ' (' || p_department || ').'
    || coalesce(' ' || nullif(btrim(p_remark), ''), ''));
  perform public.notify_user(v_officer.id, 'New case assigned to you',
    'You have been assigned ' || v_g.complaint_id || ': "' || v_g.subject || '" (' || v_g.priority || ' priority).',
    v_g.id, '/officer/grievance/' || v_g.id, 'assignment');
  perform public.notify_user(v_g.citizen_id, 'Officer assigned to your grievance',
    'Officer ' || v_officer.name || ' (' || p_department || ') is now handling ' || v_g.complaint_id || '.',
    v_g.id, '/citizen/grievance/' || v_g.id, 'info');

  return v_g;
end;
$$;

-- Department head / admin rejects an invalid or out-of-jurisdiction grievance.
create or replace function public.reject_grievance(p_grievance_id uuid, p_reason text)
returns public.grievances
language plpgsql security definer set search_path = ''
as $$
declare
  v_role public.app_role := public.current_app_role();
  v_g public.grievances;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  select * into v_g from public.grievances where id = p_grievance_id for update;
  if not found then
    raise exception 'Grievance not found' using errcode = 'P0002';
  end if;

  if v_role is null or not (v_role = 'admin' or (v_role = 'department_head' and v_g.department = public.current_department())) then
    raise exception 'You are not allowed to reject this grievance' using errcode = '42501';
  end if;

  if v_g.status not in ('Submitted', 'Under Review') then
    raise exception 'Only grievances awaiting triage can be rejected (current status: %)', v_g.status using errcode = '22023';
  end if;

  if char_length(v_reason) < 5 then
    raise exception 'A rejection reason of at least 5 characters is required' using errcode = '22023';
  end if;

  update public.grievances set
    status = 'Rejected',
    rejection_reason = v_reason,
    admin_remark = 'REJECTED: ' || v_reason,
    rejected_at = now()
  where id = p_grievance_id
  returning * into v_g;

  perform public.log_grievance_event(v_g.id, 'Rejected', v_reason);
  perform public.notify_user(v_g.citizen_id, 'Grievance rejected',
    'Your grievance ' || v_g.complaint_id || ' was rejected: ' || v_reason,
    v_g.id, '/citizen/grievance/' || v_g.id, 'escalation');

  return v_g;
end;
$$;

-- Assigned officer uploads proof of the completed repair.
create or replace function public.resolve_grievance(p_grievance_id uuid, p_resolution_image_url text, p_remark text)
returns public.grievances
language plpgsql security definer set search_path = ''
as $$
declare
  v_role public.app_role := public.current_app_role();
  v_g public.grievances;
  v_remark text := btrim(coalesce(p_remark, ''));
  v_image text := btrim(coalesce(p_resolution_image_url, ''));
begin
  select * into v_g from public.grievances where id = p_grievance_id for update;
  if not found then
    raise exception 'Grievance not found' using errcode = 'P0002';
  end if;

  if v_role is null or not (v_role = 'admin' or (v_role = 'officer' and v_g.assigned_officer_id = auth.uid())) then
    raise exception 'Only the assigned officer can resolve this grievance' using errcode = '42501';
  end if;

  if v_g.status not in ('In Progress', 'Reopened') then
    raise exception 'Only grievances in progress can be resolved (current status: %)', v_g.status using errcode = '22023';
  end if;

  if v_image !~ '^https?://' then
    raise exception 'A resolution proof photo is required' using errcode = '22023';
  end if;

  if char_length(v_remark) < 5 then
    raise exception 'Work completion remarks are required' using errcode = '22023';
  end if;

  update public.grievances set
    status = 'Resolved',
    resolution_image_url = v_image,
    admin_remark = v_remark,
    resolved_at = now()
  where id = p_grievance_id
  returning * into v_g;

  perform public.log_grievance_event(v_g.id, 'Resolved', v_remark);
  perform public.notify_user(v_g.citizen_id, 'Action required: verify the resolution',
    'Officer ' || coalesce(v_g.assigned_officer_name, '') || ' uploaded proof for ' || v_g.complaint_id || '. Please approve or reopen.',
    v_g.id, '/citizen/grievance/' || v_g.id, 'action_required');
  perform public.notify_department(v_g.department, 'Resolution proof submitted',
    v_g.complaint_id || ' was marked resolved and is awaiting citizen verification.', v_g.id, 'info');

  return v_g;
end;
$$;

-- Citizen approves (closes, with rating) or rejects (reopens) the resolution.
create or replace function public.verify_resolution(
  p_grievance_id uuid,
  p_approve boolean,
  p_rating integer default null,
  p_comment text default null,
  p_reopen_reason text default null,
  p_reopen_image_url text default null
)
returns public.grievances
language plpgsql security definer set search_path = ''
as $$
declare
  v_g public.grievances;
  v_reason text := btrim(coalesce(p_reopen_reason, ''));
  v_image text := nullif(btrim(coalesce(p_reopen_image_url, '')), '');
begin
  select * into v_g from public.grievances where id = p_grievance_id for update;
  if not found or v_g.citizen_id is distinct from auth.uid() then
    raise exception 'Only the citizen who filed this grievance can verify it' using errcode = '42501';
  end if;

  if v_g.status <> 'Resolved' then
    raise exception 'This grievance is not awaiting verification (current status: %)', v_g.status using errcode = '22023';
  end if;

  if p_approve then
    if p_rating is null or p_rating not between 1 and 5 then
      raise exception 'Rating must be between 1 and 5' using errcode = '22023';
    end if;

    update public.grievances set
      status = 'Closed',
      rating = p_rating,
      feedback_comment = coalesce(nullif(btrim(p_comment), ''), 'Citizen approved resolution.'),
      closed_at = now()
    where id = p_grievance_id
    returning * into v_g;

    perform public.log_grievance_event(v_g.id, 'Closed',
      'Citizen confirmed the issue is resolved and rated the work ' || p_rating || '/5.');
    perform public.notify_user(v_g.assigned_officer_id, 'Resolution approved by citizen',
      v_g.complaint_id || ' was verified and closed with a ' || p_rating || '/5 rating.',
      v_g.id, '/officer/grievance/' || v_g.id, 'info');
    perform public.notify_department(v_g.department, 'Case verified and closed',
      'Citizen approved the resolution of ' || v_g.complaint_id || ' (' || p_rating || '/5).', v_g.id, 'info');
  else
    if char_length(v_reason) < 5 then
      raise exception 'Please explain why the problem is not solved' using errcode = '22023';
    end if;
    if v_image is not null and v_image !~ '^https?://' then
      raise exception 'Invalid photo URL' using errcode = '22023';
    end if;

    update public.grievances set
      status = 'Reopened',
      reopen_reason = v_reason,
      reopen_image_url = v_image,
      reopened_count = reopened_count + 1,
      reopened_at = now(),
      admin_remark = 'REOPENED BY CITIZEN: ' || v_reason
    where id = p_grievance_id
    returning * into v_g;

    perform public.log_grievance_event(v_g.id, 'Reopened', 'Citizen rejected the resolution: ' || v_reason);
    perform public.notify_user(v_g.assigned_officer_id, 'Work rejected by citizen — case reopened',
      v_g.complaint_id || ': "' || v_reason || '". Re-inspection required.',
      v_g.id, '/officer/grievance/' || v_g.id, 'escalation');
    perform public.notify_department(v_g.department, 'Grievance reopened',
      v_g.complaint_id || ' was reopened by the citizen: "' || v_reason || '".', v_g.id, 'escalation');
  end if;

  return v_g;
end;
$$;

-- Lets a citizen spot an existing open complaint of the same category nearby
-- before filing a duplicate. Returns only non-personal fields.
create or replace function public.find_similar_grievances(
  p_category text,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_location text default null
)
returns table (id uuid, complaint_id text, subject text, status public.grievance_status, location text, is_own boolean)
language sql stable security definer set search_path = ''
as $$
  select g.id, g.complaint_id, g.subject, g.status, g.location, g.citizen_id = auth.uid()
  from public.grievances g
  where auth.uid() is not null
    and g.category = p_category
    and g.status not in ('Closed', 'Rejected')
    and (
      (p_latitude is not null and p_longitude is not null and g.latitude is not null and g.longitude is not null
        and abs(g.latitude - p_latitude) < 0.008 and abs(g.longitude - p_longitude) < 0.008)
      or (
        p_location is not null and (
          select count(*) from regexp_split_to_table(lower(p_location), '[\s,]+') w
          where char_length(w) >= 4 and position(w in lower(g.location)) > 0
        ) >= 2
      )
    )
  order by g.created_at desc
  limit 3
$$;

-- Anonymised feed for the public transparency portal. Personal data is never
-- exposed; subject, location and photos are only published for cases the
-- citizen has verified and closed.
create or replace function public.public_grievance_feed()
returns table (
  complaint_id text, category text, department text, priority public.grievance_priority,
  status public.grievance_status, created_at timestamptz, resolved_at timestamptz, closed_at timestamptz,
  rating smallint, subject text, location text, image_url text, resolution_image_url text,
  assigned_officer_name text, latitude double precision, longitude double precision
)
language sql stable security definer set search_path = ''
as $$
  select g.complaint_id, g.category, g.department, g.priority, g.status,
         g.created_at, g.resolved_at, g.closed_at, g.rating,
         case when g.status = 'Closed' then g.subject end,
         case when g.status = 'Closed' then g.location end,
         case when g.status = 'Closed' then g.image_url end,
         case when g.status = 'Closed' then g.resolution_image_url end,
         case when g.status = 'Closed' then g.assigned_officer_name end,
         case when g.status = 'Closed' then g.latitude end,
         case when g.status = 'Closed' then g.longitude end
  from public.grievances g
  order by g.created_at desc
$$;

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.departments enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.grievances enable row level security;
alter table public.grievance_events enable row level security;
alter table public.notifications enable row level security;

create policy "departments are public" on public.departments for select using (true);
create policy "admins manage departments" on public.departments for all
  using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

create policy "categories are public" on public.categories for select using (true);
create policy "admins manage categories" on public.categories for all
  using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

create policy "read own profile" on public.profiles for select
  using (id = auth.uid());
create policy "staff read profiles" on public.profiles for select
  using (public.current_app_role() in ('officer', 'department_head', 'admin'));
create policy "update own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "admins update profiles" on public.profiles for update
  using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

create policy "citizens read own grievances" on public.grievances for select
  using (citizen_id = auth.uid());
create policy "admins read all grievances" on public.grievances for select
  using (public.current_app_role() = 'admin');
create policy "department heads read department grievances" on public.grievances for select
  using (public.current_app_role() = 'department_head' and department = public.current_department());
create policy "officers read assigned grievances" on public.grievances for select
  using (public.current_app_role() = 'officer' and assigned_officer_id = auth.uid());
create policy "authenticated users file grievances" on public.grievances for insert
  to authenticated with check (citizen_id = auth.uid() and public.current_app_role() is not null);
create policy "admins delete grievances" on public.grievances for delete
  using (public.current_app_role() = 'admin');

-- Events are visible whenever the parent grievance is (the sub-select is itself
-- filtered by the grievance policies above).
create policy "read events of visible grievances" on public.grievance_events for select
  using (exists (select 1 from public.grievances g where g.id = grievance_id));

create policy "read own notifications" on public.notifications for select
  using (user_id = auth.uid());
create policy "mark own notifications read" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own notifications" on public.notifications for delete
  using (user_id = auth.uid());

-- ─── Privileges ─────────────────────────────────────────────────────────────
revoke all on public.grievances from anon;
revoke all on public.profiles from anon;
revoke all on public.grievance_events from anon;
revoke all on public.notifications from anon;

revoke update on public.grievances from authenticated;
revoke insert, update, delete on public.grievance_events from authenticated;
revoke insert, update on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;
revoke update on public.profiles from authenticated;
grant update (name, phone, role, department, designation, is_active) on public.profiles to authenticated;

revoke execute on function public.assign_grievance(uuid, text, uuid, public.grievance_priority, text) from public, anon;
revoke execute on function public.reject_grievance(uuid, text) from public, anon;
revoke execute on function public.resolve_grievance(uuid, text, text) from public, anon;
revoke execute on function public.verify_resolution(uuid, boolean, integer, text, text, text) from public, anon;
revoke execute on function public.find_similar_grievances(text, double precision, double precision, text) from public, anon;
grant execute on function public.assign_grievance(uuid, text, uuid, public.grievance_priority, text) to authenticated;
grant execute on function public.reject_grievance(uuid, text) to authenticated;
grant execute on function public.resolve_grievance(uuid, text, text) to authenticated;
grant execute on function public.verify_resolution(uuid, boolean, integer, text, text, text) to authenticated;
grant execute on function public.find_similar_grievances(text, double precision, double precision, text) to authenticated;
grant execute on function public.public_grievance_feed() to anon, authenticated;

-- ─── Realtime (live notification badge) ─────────────────────────────────────
alter publication supabase_realtime add table public.notifications;

-- ─── Storage: grievance photos ──────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('grievance-photos', 'grievance-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Each user uploads into a folder named after their own user id.
-- The bucket is public, so photos are served by URL without a SELECT policy
-- (which would also let anyone list every file).
create policy "users upload own grievance photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'grievance-photos' and (storage.foldername(name))[1] = auth.uid()::text);
