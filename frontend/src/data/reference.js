// Static reference data shared by the UI. Categories and departments mirror
// the rows seeded in supabase/seed.sql (the database is the source of truth
// for which department a category is routed to).

export const STEPS = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed'];

export const ACTIVE_STATUSES = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Reopened'];
export const ARCHIVED_STATUSES = ['Closed', 'Rejected'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// Target resolution time per priority (hours). Mirrors public.sla_hours().
export const SLA_HOURS = { Critical: 24, High: 48, Medium: 72, Low: 168 };

export const CATEGORIES = [
  'Road & Infrastructure',
  'Water Supply',
  'Electricity',
  'Sanitation',
  'Street Lights',
  'Public Safety',
  'Other',
];

export const DEPARTMENTS = [
  'Sanitation Department',
  'PWD (Roads & Infrastructure)',
  'Electrical Department',
  'Water Department',
  'Public Safety & Health',
  'General Municipal Administration',
];

export const CATEGORY_DEPARTMENT_MAP = {
  'Road & Infrastructure': 'PWD (Roads & Infrastructure)',
  'Sanitation': 'Sanitation Department',
  'Street Lights': 'Electrical Department',
  'Electricity': 'Electrical Department',
  'Water Supply': 'Water Department',
  'Public Safety': 'Public Safety & Health',
  'Other': 'General Municipal Administration',
};

export const SAMPLE_PROBLEM_PHOTOS = [
  {
    label: 'Overflowing Garbage Bin',
    category: 'Sanitation',
    url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Deep Road Pothole',
    category: 'Road & Infrastructure',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Dark / Faulty Streetlight',
    category: 'Street Lights',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Burst Water Pipeline',
    category: 'Water Supply',
    url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
  },
];

export const SAMPLE_RESOLVED_PHOTOS = [
  {
    label: 'Cleaned Area & Sanitized Bin',
    category: 'Sanitation',
    url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80',
    remark: 'Waste cleared with hydraulic loader, ground disinfected and new bin placed.',
  },
  {
    label: 'Repaved Asphalt Road Surface',
    category: 'Road & Infrastructure',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    remark: 'Pothole excavated, cold-mix asphalt laid and compacted with vibratory roller.',
  },
  {
    label: 'Functional LED Light Installed',
    category: 'Street Lights',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
    remark: 'Replaced damaged copper wiring and installed new 45W energy-saving LED luminaire.',
  },
  {
    label: 'Pipeline Replaced & Leak Sealed',
    category: 'Water Supply',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
    remark: 'Replaced corroded joint with heavy-duty PVC pipe section. Water pressure restored to 2.5 bar.',
  },
];

export const SAMPLE_REJECTION_PHOTOS = [
  {
    label: 'Pothole Still Incomplete / Loose Gravel',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    reason: 'Only filled with loose gravel. Not rolled or asphalted; gravel is already scattering onto traffic.',
  },
  {
    label: 'Garbage Remains Piled Behind Bin',
    url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    reason: 'The bin itself was emptied but bulk waste left dumped on footpath and not cleaned.',
  },
  {
    label: 'Streetlight Still Non-Functional',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80',
    reason: 'Bulb was replaced but still does not light up at night due to wiring fault.',
  },
];
