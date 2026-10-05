export const STEPS = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

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

export const OFFICERS = [
  {
    id: 'demo-officer-01',
    name: 'Rahul Sharma',
    role: 'Senior Field Officer',
    department: 'Sanitation Department',
    phone: '9876543211',
    activeCases: 4,
  },
  {
    id: 'demo-officer-02',
    name: 'Amit Verma',
    role: 'Infrastructure Engineer',
    department: 'PWD (Roads & Infrastructure)',
    phone: '9876543214',
    activeCases: 6,
  },
  {
    id: 'demo-officer-03',
    name: 'Sneha Iyer',
    role: 'Electrical Lines Inspector',
    department: 'Electrical Department',
    phone: '9876543215',
    activeCases: 3,
  },
  {
    id: 'demo-officer-04',
    name: 'Vikram Singh',
    role: 'Hydraulic Systems Officer',
    department: 'Water Department',
    phone: '9876543216',
    activeCases: 2,
  },
];

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

export const mockGrievances = [
  {
    id: 'demo-grv-1',
    complaintId: 'GRV-2026-00125',
    citizen: 'Aarav Patel',
    citizenName: 'Aarav Patel',
    citizenEmail: 'aarav.citizen@jansewa.gov.in',
    category: 'Sanitation',
    subject: 'Garbage bin overflowing near Vegetable Market',
    description: 'The municipal bin has been overflowing for over 3 days, causing bad odor and stray dog menace.',
    location: 'Vegetable Market Road, Sector 4, Bhayandar West',
    priority: 'High',
    department: 'Sanitation Department',
    assignedOfficerId: 'demo-officer-01',
    assignedOfficerName: 'Rahul Sharma',
    status: 'In Progress',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    resolutionImageUrl: '',
    adminRemark: 'Sanitation crew dispatched with collection vehicle.',
    createdAt: '23 Sep 2026',
    timeline: [
      { status: 'Submitted', time: '23 Sep, 10:32 AM' },
      { status: 'Under Review', time: '23 Sep, 12:15 PM' },
      { status: 'In Progress', time: '23 Sep, 2:00 PM' },
    ],
  },
  {
    id: 'demo-grv-2',
    complaintId: 'GRV-2026-00118',
    citizen: 'Aarav Patel',
    citizenName: 'Aarav Patel',
    citizenEmail: 'aarav.citizen@jansewa.gov.in',
    category: 'Street Lights',
    subject: 'Street light non-functional along Highway Link',
    description: 'Street light pole near building entrance is completely dark at night.',
    location: 'Highway Link Road, Bhayandar East',
    department: 'Electrical Department',
    priority: 'Medium',
    assignedOfficerId: 'demo-officer-01',
    assignedOfficerName: 'Rahul Sharma',
    status: 'Resolved',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80',
    resolutionImageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
    adminRemark: 'New 45W LED fixture installed and verified.',
    createdAt: '21 Sep 2026',
    timeline: [
      { status: 'Submitted', time: '21 Sep, 9:10 AM' },
      { status: 'Under Review', time: '21 Sep, 11:00 AM' },
      { status: 'In Progress', time: '21 Sep, 4:30 PM' },
      { status: 'Resolved', time: '22 Sep, 1:45 PM' },
    ],
  },
  {
    id: 'demo-grv-3',
    complaintId: 'GRV-2026-00109',
    citizen: 'Sneha Iyer',
    citizenName: 'Sneha Iyer',
    citizenEmail: 'sneha@example.com',
    category: 'Road & Infrastructure',
    subject: 'Big pothole on main road causing accidents',
    description: 'A deep pothole near the bus stop is causing accidents and vehicle damage.',
    location: 'Mira Road East near Station',
    department: '',
    priority: 'Critical',
    assignedOfficerId: null,
    assignedOfficerName: null,
    status: 'Submitted',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    resolutionImageUrl: '',
    adminRemark: '',
    createdAt: '20 Sep 2026',
    timeline: [{ status: 'Submitted', time: '20 Sep, 8:05 PM' }],
  },
];
