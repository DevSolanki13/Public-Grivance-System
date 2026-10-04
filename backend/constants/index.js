/**
 * JanSewa Domain Constants & Status Definitions
 */

export const ROLES = {
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  DEPARTMENT_HEAD: 'department_head',
  ADMIN: 'admin',
};

export const GRIEVANCE_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CITIZEN_SATISFIED: 'CITIZEN_SATISFIED',
  CITIZEN_REOPENED: 'CITIZEN_REOPENED',
  ESCALATED: 'ESCALATED',
  REJECTED: 'REJECTED',
};

export const PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const DEFAULT_SLA_HOURS = {
  LOW: 120,    // 5 days
  MEDIUM: 72,  // 3 days
  HIGH: 48,    // 2 days
  URGENT: 24,  // 1 day
};

export const DEPARTMENTS = [
  {
    id: 'dept-roads',
    code: 'PWD',
    name: 'Roads & Infrastructure',
    description: 'Potholes, road damage, footpaths, bridges, and flyovers',
    slaHoursDefault: 120,
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
    slaHoursDefault: 48,
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
    slaHoursDefault: 72,
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
    slaHoursDefault: 48,
    headOfficerId: 'user-head-electrical',
    headOfficerName: 'Pooja Deshmukh',
    email: 'electrical@jansewa.gov.in',
    phone: '022-28190044',
    icon: 'Lightbulb',
  },
];

export const CATEGORIES = [
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
