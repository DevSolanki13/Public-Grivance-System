-- Demo data for local development and automated tests.
-- Every demo account uses the password: Demo@12345
-- (Never run this seed against a production project.)

-- ─── Reference data ─────────────────────────────────────────────────────────
insert into public.departments (name, description) values
  ('Sanitation Department', 'Waste collection, bins, drains and public cleanliness'),
  ('PWD (Roads & Infrastructure)', 'Roads, potholes, footpaths and civic structures'),
  ('Electrical Department', 'Street lights and municipal electrical lines'),
  ('Water Department', 'Drinking water supply, pipelines and leakages'),
  ('Public Safety & Health', 'Encroachments, hazards and public health'),
  ('General Municipal Administration', 'Everything else')
on conflict do nothing;

insert into public.categories (name, department) values
  ('Road & Infrastructure', 'PWD (Roads & Infrastructure)'),
  ('Water Supply', 'Water Department'),
  ('Electricity', 'Electrical Department'),
  ('Sanitation', 'Sanitation Department'),
  ('Street Lights', 'Electrical Department'),
  ('Public Safety', 'Public Safety & Health'),
  ('Other', 'General Municipal Administration')
on conflict do nothing;

-- ─── Demo users ─────────────────────────────────────────────────────────────
create temporary table demo_users (id uuid, email text, name text, phone text, role public.app_role, department text, designation text);

insert into demo_users values
  ('11111111-1111-4111-8111-000000000001', 'aarav.citizen@demo.jansewa.in', 'Aarav Patel', '9876543210', 'citizen', null, ''),
  ('11111111-1111-4111-8111-000000000002', 'sneha.citizen@demo.jansewa.in', 'Sneha Kulkarni', '9876543220', 'citizen', null, ''),
  ('22222222-2222-4222-8222-000000000001', 'rahul.officer@demo.jansewa.in', 'Rahul Sharma', '9876543211', 'officer', 'Sanitation Department', 'Senior Field Officer'),
  ('22222222-2222-4222-8222-000000000002', 'amit.officer@demo.jansewa.in', 'Amit Verma', '9876543214', 'officer', 'PWD (Roads & Infrastructure)', 'Infrastructure Engineer'),
  ('22222222-2222-4222-8222-000000000003', 'anjali.officer@demo.jansewa.in', 'Anjali Nair', '9876543215', 'officer', 'Electrical Department', 'Electrical Lines Inspector'),
  ('22222222-2222-4222-8222-000000000004', 'vikram.officer@demo.jansewa.in', 'Vikram Singh', '9876543216', 'officer', 'Water Department', 'Hydraulic Systems Officer'),
  ('22222222-2222-4222-8222-000000000005', 'neha.officer@demo.jansewa.in', 'Neha Joshi', '9876543217', 'officer', 'Sanitation Department', 'Sanitation Inspector'),
  ('22222222-2222-4222-8222-000000000006', 'imran.officer@demo.jansewa.in', 'Imran Shaikh', '9876543218', 'officer', 'Public Safety & Health', 'Safety Officer'),
  ('22222222-2222-4222-8222-000000000007', 'kavya.officer@demo.jansewa.in', 'Kavya Menon', '9876543219', 'officer', 'General Municipal Administration', 'Ward Officer'),
  ('33333333-3333-4333-8333-000000000001', 'priya.head@demo.jansewa.in', 'Priya Verma', '9876543212', 'department_head', 'Sanitation Department', 'Head of Department'),
  ('33333333-3333-4333-8333-000000000002', 'karan.head@demo.jansewa.in', 'Karan Mehta', '9876543230', 'department_head', 'PWD (Roads & Infrastructure)', 'Executive Engineer'),
  ('33333333-3333-4333-8333-000000000003', 'meera.head@demo.jansewa.in', 'Meera Rao', '9876543231', 'department_head', 'Electrical Department', 'Head of Department'),
  ('33333333-3333-4333-8333-000000000004', 'suresh.head@demo.jansewa.in', 'Suresh Patil', '9876543232', 'department_head', 'Water Department', 'Head of Department'),
  ('33333333-3333-4333-8333-000000000005', 'farah.head@demo.jansewa.in', 'Farah Khan', '9876543233', 'department_head', 'Public Safety & Health', 'Head of Department'),
  ('33333333-3333-4333-8333-000000000006', 'joseph.head@demo.jansewa.in', 'Joseph Dsouza', '9876543234', 'department_head', 'General Municipal Administration', 'Assistant Commissioner'),
  ('44444444-4444-4444-8444-000000000001', 'admin@demo.jansewa.in', 'Super Admin', '9876543213', 'admin', null, 'Municipal Commissioner');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated', d.email,
  extensions.crypt('Demo@12345', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', d.name, 'phone', d.phone),
  now(), now(), '', '', '', ''
from demo_users d;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), d.id, d.id::text,
       jsonb_build_object('sub', d.id::text, 'email', d.email, 'email_verified', true),
       'email', now(), now(), now()
from demo_users d;

-- handle_new_user() created citizen profiles; promote the staff accounts.
update public.profiles p set
  role = d.role,
  department = d.department,
  designation = d.designation
from demo_users d
where p.id = d.id;

-- ─── Demo grievances ────────────────────────────────────────────────────────
insert into public.grievances (
  id, complaint_id, citizen_id, citizen_name, citizen_email, category, subcategory, subject, description,
  location, latitude, longitude, priority, department, assigned_officer_id, assigned_officer_name, status,
  admin_remark, rejection_reason, image_url, resolution_image_url, rating, feedback_comment,
  created_at, resolved_at, closed_at, rejected_at
) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'GRV-2026-00125', '11111111-1111-4111-8111-000000000001', 'Aarav Patel', 'aarav.citizen@demo.jansewa.in',
   'Sanitation', 'Overflowing bin', 'Garbage bin overflowing near Vegetable Market',
   'The municipal bin has been overflowing for over 3 days, causing bad odour and a stray dog menace.',
   'Vegetable Market Road, Sector 4, Bhayandar West', 19.3012, 72.8521, 'High', 'Sanitation Department',
   '22222222-2222-4222-8222-000000000001', 'Rahul Sharma', 'In Progress',
   'Sanitation team dispatched with loader vehicle.', null,
   'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80', '', null, null,
   now() - interval '2 days', null, null, null),

  ('aaaaaaaa-0000-4000-8000-000000000002', 'GRV-2026-00118', '11111111-1111-4111-8111-000000000001', 'Aarav Patel', 'aarav.citizen@demo.jansewa.in',
   'Street Lights', 'Light not working', 'Street light pole non-functional along Highway Link',
   'Street light pole near the building entrance is completely dark at night, high risk for pedestrians.',
   'Highway Link Road, Bhayandar East', 19.3050, 72.8650, 'Medium', 'Electrical Department',
   '22222222-2222-4222-8222-000000000003', 'Anjali Nair', 'Resolved',
   'New 45W energy-efficient LED luminaire installed and tested.', null,
   'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80', null, null,
   now() - interval '3 days', now() - interval '1 day', null, null),

  ('aaaaaaaa-0000-4000-8000-000000000003', 'GRV-2026-00109', '11111111-1111-4111-8111-000000000001', 'Aarav Patel', 'aarav.citizen@demo.jansewa.in',
   'Road & Infrastructure', 'Pothole', 'Dangerous pothole cluster near flyover approach',
   'Multiple deep potholes right at the ramp entrance causing two-wheeler skids and traffic jams.',
   'Flyover Ramp, Western Expressway, Mira Road', 19.2814, 72.8689, 'Critical', 'PWD (Roads & Infrastructure)',
   null, null, 'Submitted', '', null,
   'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80', '', null, null,
   now() - interval '6 hours', null, null, null),

  ('aaaaaaaa-0000-4000-8000-000000000004', 'GRV-2026-00094', '11111111-1111-4111-8111-000000000001', 'Aarav Patel', 'aarav.citizen@demo.jansewa.in',
   'Water Supply', 'Water leakage', 'Drinking water pipeline valve burst on Station Road',
   'Pressurised water gushing onto the road, flooding local shops and wasting fresh water supply.',
   'Station Road, Opp Municipal Market, Virar West', 19.4521, 72.8012, 'Critical', 'Water Department',
   '22222222-2222-4222-8222-000000000004', 'Vikram Singh', 'Closed',
   'High-pressure cast iron coupling replaced and tested with full line pressure.', null,
   'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', 5,
   'Pipeline valve replaced swiftly and asphalt patched. Excellent work by the municipal crew.',
   now() - interval '6 days', now() - interval '5 days 8 hours', now() - interval '5 days', null),

  ('aaaaaaaa-0000-4000-8000-000000000005', 'GRV-2026-00088', '11111111-1111-4111-8111-000000000001', 'Aarav Patel', 'aarav.citizen@demo.jansewa.in',
   'Public Safety', 'Encroachment', 'Private parking fencing dispute inside housing society',
   'Dispute between society members over assigned parking space barricades.',
   'Green Meadows Co-op Housing, Sector 2', 19.2900, 72.8600, 'Low', 'Public Safety & Health',
   null, null, 'Rejected',
   'REJECTED: Internal private co-operative housing society dispute, outside municipal jurisdiction.',
   'Internal private co-operative housing society dispute, outside municipal jurisdiction.',
   'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80', '', null, null,
   now() - interval '9 days', null, null, now() - interval '8 days'),

  ('aaaaaaaa-0000-4000-8000-000000000006', 'GRV-2026-00071', '11111111-1111-4111-8111-000000000002', 'Sneha Kulkarni', 'sneha.citizen@demo.jansewa.in',
   'Sanitation', 'Missed pickup', 'Garbage not collected for a week in Shanti Park',
   'Door-to-door garbage collection has not happened for seven days in our lane.',
   'Shanti Park, Sector 5, Mira Road East', 19.2830, 72.8700, 'Medium', 'Sanitation Department',
   '22222222-2222-4222-8222-000000000005', 'Neha Joshi', 'Closed',
   'Collection route restored and backlog cleared.', null,
   'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80', 4,
   'Collection is regular again.',
   now() - interval '12 days', now() - interval '11 days', now() - interval '10 days', null),

  ('aaaaaaaa-0000-4000-8000-000000000007', 'GRV-2026-00064', '11111111-1111-4111-8111-000000000002', 'Sneha Kulkarni', 'sneha.citizen@demo.jansewa.in',
   'Road & Infrastructure', 'Broken footpath', 'Broken footpath slabs outside the railway station',
   'Several footpath slabs are broken and lifted, senior citizens are tripping on them.',
   'Station Road, Market Area, Bhayandar West', 19.3020, 72.8530, 'High', 'PWD (Roads & Infrastructure)',
   '22222222-2222-4222-8222-000000000002', 'Amit Verma', 'In Progress',
   'Replacement slabs ordered; work scheduled.', null,
   'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80', '', null, null,
   now() - interval '4 days', null, null, null);

-- Lifecycle timelines (the insert trigger already logged "Submitted").
insert into public.grievance_events (grievance_id, status, remark, actor_id, actor_name, created_at) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'In Progress', 'Assigned to Rahul Sharma (Sanitation Department). Sanitation team dispatched with loader vehicle.', '33333333-3333-4333-8333-000000000001', 'Priya Verma', now() - interval '1 day 20 hours'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'In Progress', 'Assigned to Anjali Nair (Electrical Department).', '33333333-3333-4333-8333-000000000003', 'Meera Rao', now() - interval '2 days 20 hours'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Resolved', 'New 45W energy-efficient LED luminaire installed and tested.', '22222222-2222-4222-8222-000000000003', 'Anjali Nair', now() - interval '1 day'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'In Progress', 'Assigned to Vikram Singh (Water Department).', '33333333-3333-4333-8333-000000000004', 'Suresh Patil', now() - interval '5 days 22 hours'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Resolved', 'High-pressure cast iron coupling replaced and tested with full line pressure.', '22222222-2222-4222-8222-000000000004', 'Vikram Singh', now() - interval '5 days 8 hours'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Closed', 'Citizen confirmed the issue is resolved and rated the work 5/5.', '11111111-1111-4111-8111-000000000001', 'Aarav Patel', now() - interval '5 days'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'Rejected', 'Internal private co-operative housing society dispute, outside municipal jurisdiction.', '33333333-3333-4333-8333-000000000005', 'Farah Khan', now() - interval '8 days'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'In Progress', 'Assigned to Neha Joshi (Sanitation Department).', '33333333-3333-4333-8333-000000000001', 'Priya Verma', now() - interval '11 days 20 hours'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Resolved', 'Collection route restored and backlog cleared.', '22222222-2222-4222-8222-000000000005', 'Neha Joshi', now() - interval '11 days'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Closed', 'Citizen confirmed the issue is resolved and rated the work 4/5.', '11111111-1111-4111-8111-000000000002', 'Sneha Kulkarni', now() - interval '10 days'),
  ('aaaaaaaa-0000-4000-8000-000000000007', 'In Progress', 'Assigned to Amit Verma (PWD (Roads & Infrastructure)).', '33333333-3333-4333-8333-000000000002', 'Karan Mehta', now() - interval '3 days 18 hours');

-- A few starter notifications so every demo role has something in the bell.
insert into public.notifications (user_id, title, message, grievance_id, link, type, created_at) values
  ('11111111-1111-4111-8111-000000000001', 'Action required: verify the resolution',
   'Officer Anjali Nair uploaded proof for GRV-2026-00118. Please approve or reopen.',
   'aaaaaaaa-0000-4000-8000-000000000002', '/citizen/grievance/aaaaaaaa-0000-4000-8000-000000000002', 'action_required', now() - interval '1 day'),
  ('22222222-2222-4222-8222-000000000001', 'New case assigned to you',
   'You have been assigned GRV-2026-00125: "Garbage bin overflowing near Vegetable Market" (High priority).',
   'aaaaaaaa-0000-4000-8000-000000000001', '/officer/grievance/aaaaaaaa-0000-4000-8000-000000000001', 'assignment', now() - interval '1 day 20 hours'),
  ('33333333-3333-4333-8333-000000000002', 'New grievance filed',
   'New case GRV-2026-00109 (Road & Infrastructure) at Flyover Ramp, Western Expressway, Mira Road is awaiting assignment.',
   'aaaaaaaa-0000-4000-8000-000000000003', '/admin/grievance/aaaaaaaa-0000-4000-8000-000000000003', 'assignment', now() - interval '6 hours'),
  ('44444444-4444-4444-8444-000000000001', 'New grievance filed',
   'New case GRV-2026-00109 (Road & Infrastructure) at Flyover Ramp, Western Expressway, Mira Road is awaiting assignment.',
   'aaaaaaaa-0000-4000-8000-000000000003', '/admin/grievance/aaaaaaaa-0000-4000-8000-000000000003', 'assignment', now() - interval '6 hours');

drop table demo_users;
