import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data/db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const INITIAL_DEPARTMENTS = [
  {
    id: 'dept-roads',
    code: 'PWD',
    name: 'Roads & Infrastructure',
    description: 'Potholes, road damage, footpaths, bridges, and flyovers',
    slaHoursDefault: 120, // 5 days
    headOfficerId: 'user-head-roads',
    headOfficerName: 'Ramesh Kulkarni',
    email: 'pwd@jansewa.gov.in',
    phone: '022-28190011',
    icon: 'Construction',
  },
  {
    id: 'dept-sanitation',
    code: 'SWM',
    name: 'Sanitation & Solid Waste',
    description: 'Garbage collection, overflowing bins, public toilets, and dumping',
    slaHoursDefault: 48, // 2 days
    headOfficerId: 'user-head-sanitation',
    headOfficerName: 'Sneha Iyer',
    email: 'sanitation@jansewa.gov.in',
    phone: '022-28190022',
    icon: 'Trash2',
  },
  {
    id: 'dept-water',
    code: 'WSD',
    name: 'Water Supply & Sewage',
    description: 'Pipeline leakage, low water pressure, contaminated water, and drainage',
    slaHoursDefault: 72, // 3 days
    headOfficerId: 'user-head-water',
    headOfficerName: 'Vikas Patil',
    email: 'water@jansewa.gov.in',
    phone: '022-28190033',
    icon: 'Droplets',
  },
  {
    id: 'dept-electrical',
    code: 'ELE',
    name: 'Street Lighting & Electricity',
    description: 'Dark streetlights, sparking poles, open wires, and transformer issues',
    slaHoursDefault: 48, // 2 days
    headOfficerId: 'user-head-electrical',
    headOfficerName: 'Pooja Deshmukh',
    email: 'electrical@jansewa.gov.in',
    phone: '022-28190044',
    icon: 'Lightbulb',
  },
];

export const INITIAL_CATEGORIES = [
  {
    id: 'cat-roads',
    name: 'Roads & Infrastructure',
    departmentId: 'dept-roads',
    slaHours: 120,
    subcategories: ['Pothole Repair', 'Damaged Road Surface', 'Broken Footpath', 'Waterlogging on Road', 'Damaged Divider'],
  },
  {
    id: 'cat-sanitation',
    name: 'Sanitation & Solid Waste',
    departmentId: 'dept-sanitation',
    slaHours: 48,
    subcategories: ['Garbage Not Collected', 'Overflowing Dustbin', 'Illegal Dumping Yard', 'Dead Animal Removal', 'Public Toilet Cleaning'],
  },
  {
    id: 'cat-water',
    name: 'Water Supply & Sewage',
    departmentId: 'dept-water',
    slaHours: 72,
    subcategories: ['No Water Supply', 'Low Pressure', 'Contaminated/Dirty Water', 'Pipe Leakage', 'Sewage Overflow'],
  },
  {
    id: 'cat-electrical',
    name: 'Street Lighting & Electricity',
    departmentId: 'dept-electrical',
    slaHours: 48,
    subcategories: ['Streetlight Not Working', 'Flickering Streetlight', 'Damaged Electric Pole', 'Loose Overhead Wires', 'Dark Alley/Stretch'],
  },
];

// Seed realistic bcrypt hash for 'password123'
const DEFAULT_PASS_HASH = bcrypt.hashSync('password123', 10);

export const INITIAL_USERS = [
  // Citizens
  {
    id: 'user-citizen-1',
    name: 'Palak Rathod',
    email: 'palak.rathod@example.com',
    password: DEFAULT_PASS_HASH,
    phone: '9876543210',
    role: 'citizen',
    address: 'B-302, Gokul Horizon, Bhayandar West, Thane 401101',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-citizen-2',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@example.com',
    password: DEFAULT_PASS_HASH,
    phone: '9819001234',
    role: 'citizen',
    address: 'Flat 401, Silver Arch, Mira Road East, Thane 401107',
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-citizen-3',
    name: 'Sunita Joshi',
    email: 'sunita.joshi@example.com',
    password: DEFAULT_PASS_HASH,
    phone: '9833004455',
    role: 'citizen',
    address: 'House 12, Sector 3, Bhayandar West, Thane 401101',
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-citizen-4',
    name: 'Kavita Nair',
    email: 'kavita.nair@example.com',
    password: DEFAULT_PASS_HASH,
    phone: '9820556677',
    role: 'citizen',
    address: 'Temba Road, Near Municipal School, Bhayandar West 401101',
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  },

  // Field Officers
  {
    id: 'user-officer-roads',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@pwd.gov.in',
    password: DEFAULT_PASS_HASH,
    phone: '9820011223',
    role: 'officer',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Infrastructure',
    designation: 'Assistant Municipal Engineer (Roads)',
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-officer-sanitation',
    name: 'Amit Vernekar',
    email: 'amit.vernekar@sanitation.gov.in',
    password: DEFAULT_PASS_HASH,
    phone: '9820044556',
    role: 'officer',
    departmentId: 'dept-sanitation',
    departmentName: 'Sanitation & Solid Waste',
    designation: 'Sanitary Inspector - Ward 4',
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-officer-water',
    name: 'Suresh More',
    email: 'suresh.more@water.gov.in',
    password: DEFAULT_PASS_HASH,
    phone: '9820077889',
    role: 'officer',
    departmentId: 'dept-water',
    departmentName: 'Water Supply & Sewage',
    designation: 'Junior Water Works Engineer',
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-officer-elec',
    name: 'Vinay Nair',
    email: 'vinay.nair@electrical.gov.in',
    password: DEFAULT_PASS_HASH,
    phone: '9820099887',
    role: 'officer',
    departmentId: 'dept-electrical',
    departmentName: 'Street Lighting & Electricity',
    designation: 'Electrical Maintenance In-Charge',
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  },

  // Department Heads
  {
    id: 'user-head-roads',
    name: 'Ramesh Kulkarni',
    email: 'pwd@jansewa.gov.in',
    password: DEFAULT_PASS_HASH,
    phone: '022-28190011',
    role: 'department_head',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Infrastructure',
    designation: 'Executive Engineer (Roads)',
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-head-sanitation',
    name: 'Sneha Iyer',
    email: 'sneha.iyer@sanitation.gov.in',
    password: DEFAULT_PASS_HASH,
    phone: '9811122233',
    role: 'department_head',
    departmentId: 'dept-sanitation',
    departmentName: 'Sanitation & Solid Waste',
    designation: 'Chief Sanitation Officer',
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-head-water',
    name: 'Vikas Patil',
    email: 'water@jansewa.gov.in',
    password: DEFAULT_PASS_HASH,
    phone: '022-28190033',
    role: 'department_head',
    departmentId: 'dept-water',
    departmentName: 'Water Supply & Sewage',
    designation: 'Executive Engineer (Water Works)',
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'user-head-electrical',
    name: 'Pooja Deshmukh',
    email: 'electrical@jansewa.gov.in',
    password: DEFAULT_PASS_HASH,
    phone: '022-28190044',
    role: 'department_head',
    departmentId: 'dept-electrical',
    departmentName: 'Street Lighting & Electricity',
    designation: 'Chief Electrical Inspector',
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },

  // Chief Admin
  {
    id: 'user-admin-1',
    name: 'Admin Officer',
    email: 'admin@jansewa.gov.in',
    password: DEFAULT_PASS_HASH,
    phone: '9988776655',
    role: 'admin',
    designation: 'Public Grievance Redressal Commissioner',
    createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
  },
];

const now = Date.now();
const h = 3600 * 1000;

export const INITIAL_GRIEVANCES = [
  {
    id: 'grv-1',
    complaintId: 'GRV-2026-00125',
    citizenId: 'user-citizen-1',
    citizenName: 'Palak Rathod',
    citizenEmail: 'palak.rathod@example.com',
    citizenPhone: '9876543210',
    categoryId: 'cat-electrical',
    category: 'Street Lighting & Electricity',
    subcategoryId: 'sub-sl',
    subcategory: 'Streetlight Not Working',
    subject: 'Main road street light broken for 3 days',
    description: 'The street light pole near XYZ tower has been completely dark. Multiple pedestrians nearly slipped.',
    location: {
      address: 'Near XYZ Tower, Station Road',
      area: 'Bhayandar West',
      pincode: '401101',
      latitude: 19.3012,
      longitude: 72.8519,
    },
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    departmentId: 'dept-electrical',
    department: 'Street Lighting & Electricity',
    assignedOfficerId: 'user-officer-elec',
    assignedOfficerName: 'Vinay Nair',
    assignedAt: new Date(now - 14 * h).toISOString(),
    slaHours: 48,
    slaStartedAt: new Date(now - 20 * h).toISOString(),
    slaDeadline: new Date(now + 28 * h).toISOString(),
    isOverdue: false,
    isEscalated: false,
    adminRemark: 'Technician assigned for replacement of LED driver unit',
    evidence: [],
    resolution: null,
    verification: null,
    feedback: null,
    timeline: [
      {
        id: 'tl-1-1',
        status: 'SUBMITTED',
        title: 'Grievance Registered',
        description: 'Complaint registered by citizen with High priority',
        performedBy: 'Palak Rathod',
        performedByRole: 'citizen',
        timestamp: new Date(now - 20 * h).toISOString(),
      },
      {
        id: 'tl-1-2',
        status: 'UNDER_REVIEW',
        title: 'Categorized & Verified',
        description: 'Assigned to Street Lighting & Electricity Department',
        performedBy: 'Automated System',
        performedByRole: 'system',
        timestamp: new Date(now - 19 * h).toISOString(),
      },
      {
        id: 'tl-1-3',
        status: 'ASSIGNED',
        title: 'Officer Assigned',
        description: 'Assigned to Officer Vinay Nair (Maintenance In-Charge)',
        performedBy: 'Pooja Deshmukh',
        performedByRole: 'department_head',
        timestamp: new Date(now - 14 * h).toISOString(),
      },
      {
        id: 'tl-1-4',
        status: 'IN_PROGRESS',
        title: 'Field Inspection Commenced',
        description: 'Technician team dispatched with bucket ladder truck',
        performedBy: 'Vinay Nair',
        performedByRole: 'officer',
        timestamp: new Date(now - 4 * h).toISOString(),
      },
    ],
    createdAt: new Date(now - 20 * h).toISOString(),
    updatedAt: new Date(now - 4 * h).toISOString(),
  },
  {
    id: 'grv-2',
    complaintId: 'GRV-2026-00118',
    citizenId: 'user-citizen-1',
    citizenName: 'Palak Rathod',
    citizenEmail: 'palak.rathod@example.com',
    citizenPhone: '9876543210',
    categoryId: 'cat-sanitation',
    category: 'Sanitation & Solid Waste',
    subcategoryId: 'sub-g',
    subcategory: 'Garbage Not Collected',
    subject: 'Overflowing commercial waste bin near market entrance',
    description: 'Municipal bin has not been cleared for 4 days. Foul odor and stray animals creating nuisance.',
    location: {
      address: 'Vegetable Market Gate No. 2, Station Road',
      area: 'Bhayandar East',
      pincode: '401105',
      latitude: 19.3088,
      longitude: 72.8592,
    },
    priority: 'HIGH',
    status: 'AWAITING_VERIFICATION',
    departmentId: 'dept-sanitation',
    department: 'Sanitation & Solid Waste',
    assignedOfficerId: 'user-officer-sanitation',
    assignedOfficerName: 'Amit Vernekar',
    assignedAt: new Date(now - 30 * h).toISOString(),
    slaHours: 48,
    slaStartedAt: new Date(now - 36 * h).toISOString(),
    slaDeadline: new Date(now + 12 * h).toISOString(),
    isOverdue: false,
    isEscalated: false,
    adminRemark: 'Compact dumper cleared bin and washed periphery with disinfectant.',
    evidence: [],
    resolution: {
      summary: 'Heavy hydraulic compactor truck cleared 2.4 tons of refuse. Bin disinfected with sodium hypochlorite spray. Daily 6 AM collection scheduled.',
      text: 'Heavy hydraulic compactor truck cleared 2.4 tons of refuse. Bin disinfected with sodium hypochlorite spray. Daily 6 AM collection scheduled.',
      proofFiles: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'],
      proofUrls: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'],
      resolvedBy: 'Amit Vernekar',
      resolvedById: 'user-officer-sanitation',
      resolvedAt: new Date(now - 2 * h).toISOString(),
    },
    verification: null,
    feedback: null,
    timeline: [
      {
        id: 'tl-2-1',
        status: 'SUBMITTED',
        title: 'Grievance Registered',
        description: 'Complaint registered by citizen',
        performedBy: 'Palak Rathod',
        performedByRole: 'citizen',
        timestamp: new Date(now - 36 * h).toISOString(),
      },
      {
        id: 'tl-2-2',
        status: 'ASSIGNED',
        title: 'Assigned to Ward Inspector',
        description: 'Assigned to Officer Amit Vernekar',
        performedBy: 'Sneha Iyer',
        performedByRole: 'department_head',
        timestamp: new Date(now - 30 * h).toISOString(),
      },
      {
        id: 'tl-2-3',
        status: 'IN_PROGRESS',
        title: 'Waste Pickup Deployed',
        description: 'Refuse vehicle 04 deployed for spot clearing',
        performedBy: 'Amit Vernekar',
        performedByRole: 'officer',
        timestamp: new Date(now - 12 * h).toISOString(),
      },
      {
        id: 'tl-2-4',
        status: 'AWAITING_VERIFICATION',
        title: 'Resolution Submitted - Awaiting Citizen Confirmation',
        description: 'Officer submitted completion report and site photo. Awaiting citizen verification.',
        performedBy: 'Amit Vernekar',
        performedByRole: 'officer',
        timestamp: new Date(now - 2 * h).toISOString(),
      },
    ],
    createdAt: new Date(now - 36 * h).toISOString(),
    updatedAt: new Date(now - 2 * h).toISOString(),
  },
  {
    id: 'grv-3',
    complaintId: 'GRV-2026-00109',
    citizenId: 'user-citizen-2',
    citizenName: 'Aarav Mehta',
    citizenEmail: 'aarav.mehta@example.com',
    citizenPhone: '9819001234',
    categoryId: 'cat-roads',
    category: 'Roads & Infrastructure',
    subcategoryId: 'sub-pothole',
    subcategory: 'Pothole Repair',
    subject: 'Dangerous 2-foot pothole near bus terminal',
    description: 'A deep crater has opened up on the right lane near the bus terminus causing heavy traffic bottlenecks and bike skidding.',
    location: {
      address: 'Main Arterial Road opposite Bus Depot',
      area: 'Mira Road East',
      pincode: '401107',
      latitude: 19.2812,
      longitude: 72.8561,
    },
    priority: 'CRITICAL',
    status: 'SUBMITTED',
    departmentId: 'dept-roads',
    department: 'Roads & Infrastructure',
    assignedOfficerId: null,
    assignedOfficerName: null,
    assignedAt: null,
    slaHours: 24,
    slaStartedAt: new Date(now - 6 * h).toISOString(),
    slaDeadline: new Date(now + 18 * h).toISOString(),
    isOverdue: false,
    isEscalated: false,
    adminRemark: '',
    evidence: [],
    resolution: null,
    verification: null,
    feedback: null,
    timeline: [
      {
        id: 'tl-3-1',
        status: 'SUBMITTED',
        title: 'Emergency Pothole Grievance Filed',
        description: 'Auto-flagged as CRITICAL priority due to traffic hazard on primary bus corridor.',
        performedBy: 'Aarav Mehta',
        performedByRole: 'citizen',
        timestamp: new Date(now - 6 * h).toISOString(),
      },
    ],
    createdAt: new Date(now - 6 * h).toISOString(),
    updatedAt: new Date(now - 6 * h).toISOString(),
  },
  {
    id: 'grv-4',
    complaintId: 'GRV-2026-00097',
    citizenId: 'user-citizen-3',
    citizenName: 'Sunita Joshi',
    citizenEmail: 'sunita.joshi@example.com',
    citizenPhone: '9833004455',
    categoryId: 'cat-water',
    category: 'Water Supply & Sewage',
    subcategoryId: 'sub-leak',
    subcategory: 'Pipe Leakage',
    subject: 'Underground drinking water main line ruptured',
    description: 'Clean drinking water is gushing out on the road since early morning. Huge wastage.',
    location: {
      address: 'Near Old Water Tank, Sector 3',
      area: 'Bhayandar West',
      pincode: '401101',
      latitude: 19.3035,
      longitude: 72.8465,
    },
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    departmentId: 'dept-water',
    department: 'Water Supply & Sewage',
    assignedOfficerId: 'user-officer-water',
    assignedOfficerName: 'Suresh More',
    assignedAt: new Date(now - 28 * h).toISOString(),
    slaHours: 48,
    slaStartedAt: new Date(now - 32 * h).toISOString(),
    slaDeadline: new Date(now + 16 * h).toISOString(),
    isOverdue: false,
    isEscalated: false,
    adminRemark: 'Excavation team isolating section valve to install repair sleeve',
    evidence: [],
    resolution: null,
    verification: null,
    feedback: null,
    timeline: [
      {
        id: 'tl-4-1',
        status: 'SUBMITTED',
        title: 'Water Main Leakage Reported',
        description: 'Grievance submitted by citizen',
        performedBy: 'Sunita Joshi',
        performedByRole: 'citizen',
        timestamp: new Date(now - 32 * h).toISOString(),
      },
      {
        id: 'tl-4-2',
        status: 'ASSIGNED',
        title: 'Assigned to Water Maintenance Team',
        description: 'Assigned to Officer Suresh More',
        performedBy: 'Vikas Patil',
        performedByRole: 'department_head',
        timestamp: new Date(now - 28 * h).toISOString(),
      },
      {
        id: 'tl-4-3',
        status: 'IN_PROGRESS',
        title: 'Excavation & Valve Isolation in Progress',
        description: 'Road cutting permit received, team working at spot',
        performedBy: 'Suresh More',
        performedByRole: 'officer',
        timestamp: new Date(now - 8 * h).toISOString(),
      },
    ],
    createdAt: new Date(now - 32 * h).toISOString(),
    updatedAt: new Date(now - 8 * h).toISOString(),
  },
  {
    id: 'grv-5',
    complaintId: 'GRV-2026-00085',
    citizenId: 'user-citizen-1',
    citizenName: 'Palak Rathod',
    citizenEmail: 'palak.rathod@example.com',
    citizenPhone: '9876543210',
    categoryId: 'cat-sanitation',
    category: 'Sanitation & Solid Waste',
    subcategoryId: 'sub-gutter',
    subcategory: 'Public Toilet Cleaning',
    subject: 'Public toilet near market choked again',
    description: 'The toilet block was superficially cleaned yesterday, but the drain line remained choked and sewage is back on the sidewalk.',
    location: {
      address: 'Community Toilet Block 2, Fish Market',
      area: 'Bhayandar West',
      pincode: '401101',
      latitude: 19.3042,
      longitude: 72.8488,
    },
    priority: 'HIGH',
    status: 'REOPENED',
    departmentId: 'dept-sanitation',
    department: 'Sanitation & Solid Waste',
    assignedOfficerId: 'user-officer-sanitation',
    assignedOfficerName: 'Amit Vernekar',
    assignedAt: new Date(now - 80 * h).toISOString(),
    slaHours: 48,
    slaStartedAt: new Date(now - 12 * h).toISOString(),
    slaDeadline: new Date(now + 36 * h).toISOString(),
    isOverdue: false,
    isEscalated: true,
    escalationReason: 'Citizen reopened case: blockage still persists underground.',
    adminRemark: 'Reopened by citizen with photo evidence. Suction machine dispatched.',
    evidence: [],
    resolution: null,
    verification: {
      verifiedBy: 'Palak Rathod',
      verifiedAt: new Date(now - 12 * h).toISOString(),
      satisfied: false,
      reopenReason: 'Issue not resolved. The water has backed up again.',
      citizenRemarks: 'Issue not resolved. The water has backed up again.',
    },
    feedback: null,
    timeline: [
      {
        id: 'tl-5-1',
        status: 'SUBMITTED',
        title: 'Initial Complaint Filed',
        description: 'Toilet choking reported',
        performedBy: 'Palak Rathod',
        performedByRole: 'citizen',
        timestamp: new Date(now - 84 * h).toISOString(),
      },
      {
        id: 'tl-5-2',
        status: 'RESOLUTION_SUBMITTED',
        title: 'Marked Complete by Officer',
        description: 'Superficial clean done',
        performedBy: 'Amit Vernekar',
        performedByRole: 'officer',
        timestamp: new Date(now - 24 * h).toISOString(),
      },
      {
        id: 'tl-5-3',
        status: 'REOPENED',
        title: 'Citizen Rejected Resolution (Reopened)',
        description: 'Citizen verified site and noted blockage still causes overflow. Escalated to Dept Head.',
        performedBy: 'Palak Rathod',
        performedByRole: 'citizen',
        timestamp: new Date(now - 12 * h).toISOString(),
      },
    ],
    createdAt: new Date(now - 84 * h).toISOString(),
    updatedAt: new Date(now - 12 * h).toISOString(),
  },
  {
    id: 'grv-6',
    complaintId: 'GRV-2026-00072',
    citizenId: 'user-citizen-4',
    citizenName: 'Kavita Nair',
    citizenEmail: 'kavita.nair@example.com',
    citizenPhone: '9820556677',
    categoryId: 'cat-roads',
    category: 'Roads & Infrastructure',
    subcategoryId: 'sub-fp',
    subcategory: 'Broken Footpath',
    subject: 'Cracked paver blocks repaired and leveled',
    description: 'Elderly pedestrians tripping over broken paver slabs outside municipal school.',
    location: {
      address: 'Outside Municipal School No. 4, Temba Road',
      area: 'Bhayandar West',
      pincode: '401101',
      latitude: 19.3021,
      longitude: 72.8499,
    },
    priority: 'MEDIUM',
    status: 'CLOSED',
    departmentId: 'dept-roads',
    department: 'Roads & Infrastructure',
    assignedOfficerId: 'user-officer-roads',
    assignedOfficerName: 'Rahul Sharma',
    assignedAt: new Date(now - 120 * h).toISOString(),
    slaHours: 120,
    slaStartedAt: new Date(now - 124 * h).toISOString(),
    slaDeadline: new Date(now - 4 * h).toISOString(),
    isOverdue: false,
    isEscalated: false,
    adminRemark: 'Paver blocks re-laid with fresh cement mortar bedding.',
    evidence: [],
    resolution: {
      summary: 'Footpath section re-leveled with 120 interlocking paver blocks and cured for 48 hours.',
      text: 'Footpath section re-leveled with 120 interlocking paver blocks and cured for 48 hours.',
      proofFiles: ['https://images.unsplash.com/photo-1584463699039-506048d08ca6?auto=format&fit=crop&w=600&q=80'],
      proofUrls: ['https://images.unsplash.com/photo-1584463699039-506048d08ca6?auto=format&fit=crop&w=600&q=80'],
      resolvedBy: 'Rahul Sharma',
      resolvedById: 'user-officer-roads',
      resolvedAt: new Date(now - 48 * h).toISOString(),
    },
    verification: {
      verifiedBy: 'Kavita Nair',
      verifiedAt: new Date(now - 24 * h).toISOString(),
      satisfied: true,
      rating: 5,
      feedback: 'Prompt response within 3 days. Excellent workmanship by team.',
      citizenRemarks: 'Thank you! The footpath is completely level and safe now.',
    },
    feedback: {
      rating: 5,
      satisfaction: 'Very Satisfied',
      comment: 'Prompt response within 3 days. Excellent workmanship by team.',
      submittedAt: new Date(now - 24 * h).toISOString(),
    },
    timeline: [
      {
        id: 'tl-6-1',
        status: 'SUBMITTED',
        title: 'Footpath Grievance Lodged',
        description: 'Hazard to school children reported',
        performedBy: 'Kavita Nair',
        performedByRole: 'citizen',
        timestamp: new Date(now - 124 * h).toISOString(),
      },
      {
        id: 'tl-6-2',
        status: 'IN_PROGRESS',
        title: 'Masonry Work Executed',
        description: 'New interlocking blocks placed',
        performedBy: 'Rahul Sharma',
        performedByRole: 'officer',
        timestamp: new Date(now - 72 * h).toISOString(),
      },
      {
        id: 'tl-6-3',
        status: 'AWAITING_VERIFICATION',
        title: 'Work Completed',
        description: 'Proof uploaded for citizen check',
        performedBy: 'Rahul Sharma',
        performedByRole: 'officer',
        timestamp: new Date(now - 48 * h).toISOString(),
      },
      {
        id: 'tl-6-4',
        status: 'CLOSED',
        title: 'Verified & Closed with 5-Star Rating',
        description: 'Citizen verified repair and submitted positive feedback.',
        performedBy: 'Kavita Nair',
        performedByRole: 'citizen',
        timestamp: new Date(now - 24 * h).toISOString(),
      },
    ],
    createdAt: new Date(now - 124 * h).toISOString(),
    updatedAt: new Date(now - 24 * h).toISOString(),
    resolvedAt: new Date(now - 48 * h).toISOString(),
    closedAt: new Date(now - 24 * h).toISOString(),
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'user-citizen-1',
    title: 'Resolution Verification Required',
    message: 'Officer Amit Vernekar has submitted a resolution for GRV-2026-00118. Please inspect and confirm.',
    link: '/citizen/grievance/grv-2',
    type: 'success',
    grievanceId: 'grv-2',
    isRead: false,
    createdAt: new Date(now - 2 * h).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'user-officer-elec',
    title: 'New Priority Case Assigned',
    message: 'You have been assigned GRV-2026-00125 (Streetlight Outage - Bhayandar West). SLA: 28h remaining.',
    link: '/officer/grievance/grv-1',
    type: 'warning',
    grievanceId: 'grv-1',
    isRead: false,
    createdAt: new Date(now - 14 * h).toISOString(),
  },
  {
    id: 'notif-3',
    userId: 'user-head-sanitation',
    title: 'Case Reopened & Escalated',
    message: 'GRV-2026-00085 was reopened by citizen Palak Rathod. Immediate field intervention required.',
    link: '/department/grievance/grv-5',
    type: 'error',
    grievanceId: 'grv-5',
    isRead: false,
    createdAt: new Date(now - 12 * h).toISOString(),
  },
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'audit-1',
    grievanceId: 'grv-2',
    complaintId: 'GRV-2026-00118',
    action: 'RESOLUTION_SUBMITTED',
    description: 'Officer Amit Vernekar uploaded completion report with photographic evidence',
    details: 'Officer Amit Vernekar uploaded completion report with photographic evidence',
    performedBy: 'Amit Vernekar',
    performedByRole: 'officer',
    previousStatus: 'IN_PROGRESS',
    newStatus: 'AWAITING_VERIFICATION',
    timestamp: new Date(now - 2 * h).toISOString(),
  },
  {
    id: 'audit-2',
    grievanceId: 'grv-5',
    complaintId: 'GRV-2026-00085',
    action: 'REOPENED',
    description: 'Citizen rejected resolution: blockage recurring. Flagged as escalated.',
    details: 'Citizen rejected resolution: blockage recurring. Flagged as escalated.',
    performedBy: 'Palak Rathod',
    performedByRole: 'citizen',
    previousStatus: 'RESOLUTION_SUBMITTED',
    newStatus: 'REOPENED',
    timestamp: new Date(now - 12 * h).toISOString(),
  },
];

function cloneInitialData() {
  return {
    departments: JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS)),
    categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    grievances: JSON.parse(JSON.stringify(INITIAL_GRIEVANCES)),
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
  };
}

class DatabaseStore {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // Sanity check parsed structure
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.grievances)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed reading db.json, re-initializing fresh seed data:', e.message);
    }
    const initial = cloneInitialData();
    this.save(initial);
    return initial;
  }

  /**
   * Atomic file save using temp file + atomic rename
   */
  save(data = this.data) {
    const tempFile = `${DB_FILE}.${Date.now()}.${Math.floor(Math.random() * 1000)}.tmp`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, DB_FILE);
      this.data = data;
    } catch (e) {
      console.error('Failed writing db.json:', e);
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch (_) {}
    }
  }

  // --- Collection Accessors ---
  getUsers() { return this.data.users; }
  getDepartments() { return this.data.departments; }
  getCategories() { return this.data.categories; }
  getGrievances() { return this.data.grievances; }
  getNotifications() { return this.data.notifications; }
  getAuditLogs() { return this.data.auditLogs; }

  // --- Mutation Helpers ---
  addUser(user) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  addGrievance(g) {
    this.data.grievances.unshift(g);
    this.save();
    return g;
  }

  updateGrievance(id, updates) {
    const index = this.data.grievances.findIndex((g) => g.id === id || g.complaintId === id);
    if (index === -1) return null;
    const current = this.data.grievances[index];
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.grievances[index] = updated;
    this.save();
    return updated;
  }

  addNotification(notif) {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  markNotificationRead(notifId) {
    const notif = this.data.notifications.find((n) => n.id === notifId);
    if (notif) {
      notif.isRead = true;
      this.save();
    }
    return notif;
  }

  addAuditLog(entry) {
    this.data.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      description: entry.details || entry.description,
      details: entry.details || entry.description,
      ...entry,
    });
    this.save();
  }

  reset() {
    const initial = cloneInitialData();
    this.save(initial);
    return initial;
  }
}

export const db = new DatabaseStore();
