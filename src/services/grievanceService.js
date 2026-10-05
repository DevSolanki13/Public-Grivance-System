import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDate, formatDateTime } from '../utils/dateUtils';

const DEMO_STORAGE_KEY = 'jansewa_demo_grievances_v5';

// Seed demo grievances if empty in localStorage
function getDemoStore() {
  const existing = localStorage.getItem(DEMO_STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => ({
          ...item,
          createdAt: {
            toDate: () => new Date(item.createdIso || Date.now()),
            seconds: Math.floor(new Date(item.createdIso || Date.now()).getTime() / 1000),
          },
        }));
      }
    } catch {
      // ignore parse error, will re-seed
    }
  }

  // Initial seed with Synchronized Dates, Before/After Evidence Photos, and Closed/Rejected History cases
  const initial = [
    {
      id: 'demo-grv-1',
      complaintId: 'GRV-2026-00125',
      citizenId: 'demo-citizen-01',
      citizenName: 'Aarav Patel',
      citizenEmail: 'aarav.citizen@jansewa.gov.in',
      category: 'Sanitation',
      subcategory: 'Overflowing bin',
      subject: 'Garbage bin overflowing near Vegetable Market',
      description: 'The municipal bin has been overflowing for over 3 days, causing bad odor and stray dog menace.',
      location: 'Vegetable Market Road, Sector 4, Bhayandar West',
      priority: 'High',
      department: 'Sanitation Department',
      departmentId: 'Sanitation Department',
      assignedOfficerId: 'demo-officer-01',
      assignedOfficerName: 'Rahul Sharma',
      status: 'In Progress',
      adminRemark: 'Sanitation team dispatched with loader vehicle.',
      imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
      resolutionImageUrl: '',
      createdIso: '2026-10-04T10:15:00.000Z',
      timeline: [
        { status: 'Submitted', time: '04 Oct 2026, 10:15 AM' },
        { status: 'Under Review', time: '04 Oct 2026, 12:30 PM' },
        { status: 'In Progress', time: '05 Oct 2026, 09:00 AM', remark: 'Field inspection started by Rahul Sharma' },
      ],
    },
    {
      id: 'demo-grv-2',
      complaintId: 'GRV-2026-00118',
      citizenId: 'demo-citizen-01',
      citizenName: 'Aarav Patel',
      citizenEmail: 'aarav.citizen@jansewa.gov.in',
      category: 'Street Lights',
      subcategory: 'Light not working',
      subject: 'Street light pole non-functional along Highway Link',
      description: 'Street light pole near building entrance is completely dark at night, high risk for pedestrians.',
      location: 'Highway Link Road, Bhayandar East',
      priority: 'Medium',
      department: 'Electrical Department',
      departmentId: 'Electrical Department',
      assignedOfficerId: 'demo-officer-01',
      assignedOfficerName: 'Rahul Sharma',
      status: 'Resolved',
      awaitingCitizenVerification: true,
      adminRemark: 'New 45W energy-efficient LED luminaire installed and tested.',
      imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80',
      resolutionImageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
      createdIso: '2026-10-03T14:30:00.000Z',
      resolvedAt: '2026-10-05T09:30:00.000Z',
      timeline: [
        { status: 'Submitted', time: '03 Oct 2026, 02:30 PM' },
        { status: 'Under Review', time: '03 Oct 2026, 04:00 PM' },
        { status: 'In Progress', time: '04 Oct 2026, 11:00 AM' },
        { status: 'Resolved', time: '05 Oct 2026, 09:30 AM', remark: 'Resolution proof photo attached. Awaiting citizen verification.' },
      ],
    },
    {
      id: 'demo-grv-3',
      complaintId: 'GRV-2026-00109',
      citizenId: 'demo-citizen-01',
      citizenName: 'Aarav Patel',
      citizenEmail: 'aarav.citizen@jansewa.gov.in',
      category: 'Road & Infrastructure',
      subcategory: 'Pothole',
      subject: 'Dangerous pothole cluster near Flyover approach',
      description: 'Multiple deep potholes right at the ramp entrance causing two-wheeler skids and traffic jams.',
      location: 'Flyover Ramp, Western Expressway, Mira Road',
      priority: 'Critical',
      department: '',
      departmentId: '',
      assignedOfficerId: null,
      assignedOfficerName: null,
      status: 'Submitted',
      adminRemark: '',
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
      resolutionImageUrl: '',
      createdIso: '2026-10-05T07:30:00.000Z',
      timeline: [{ status: 'Submitted', time: '05 Oct 2026, 07:30 AM' }],
    },
    {
      id: 'demo-grv-4',
      complaintId: 'GRV-2026-00094',
      citizenId: 'demo-citizen-01',
      citizenName: 'Aarav Patel',
      citizenEmail: 'aarav.citizen@jansewa.gov.in',
      category: 'Water Supply',
      subcategory: 'Water leakage',
      subject: 'Major drinking water pipeline valve burst on Station Road',
      description: 'Pressurized water gushing onto the road, flooding local shops and wasting fresh water supply.',
      location: 'Station Road, Opp Municipal Market, Virar West',
      priority: 'Critical',
      department: 'Water Department',
      departmentId: 'Water Department',
      assignedOfficerId: 'demo-officer-01',
      assignedOfficerName: 'Rahul Sharma',
      status: 'Closed',
      rating: 5,
      feedbackComment: 'Pipeline valve replaced swiftly and asphalt patched. Excellent work by the municipal crew.',
      adminRemark: 'High-pressure cast iron coupling replaced and tested with full line pressure.',
      imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
      resolutionImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      createdIso: '2026-10-01T09:00:00.000Z',
      resolvedAt: '2026-10-02T16:00:00.000Z',
      closedAt: '2026-10-03T11:00:00.000Z',
      timeline: [
        { status: 'Submitted', time: '01 Oct 2026, 09:00 AM' },
        { status: 'Under Review', time: '01 Oct 2026, 09:30 AM' },
        { status: 'In Progress', time: '01 Oct 2026, 11:15 AM' },
        { status: 'Resolved', time: '02 Oct 2026, 04:00 PM', remark: 'Coupling repaired and pressure verified.' },
        { status: 'Closed', time: '03 Oct 2026, 11:00 AM', remark: 'Citizen verified and approved resolution with 5 stars.' },
      ],
    },
    {
      id: 'demo-grv-5',
      complaintId: 'GRV-2026-00088',
      citizenId: 'demo-citizen-01',
      citizenName: 'Aarav Patel',
      citizenEmail: 'aarav.citizen@jansewa.gov.in',
      category: 'Public Safety',
      subcategory: 'Encroachment',
      subject: 'Private parking fencing dispute inside housing society',
      description: 'Dispute between society members over assigned parking space barricades.',
      location: 'Green Meadows Co-op Housing, Sector 2',
      priority: 'Low',
      department: 'General Municipal Administration',
      departmentId: 'General Municipal Administration',
      assignedOfficerId: null,
      assignedOfficerName: null,
      status: 'Rejected',
      rejectionReason: 'Internal private co-operative housing society dispute. Outside municipal public jurisdiction. Please refer to Registrar of Co-operative Societies.',
      adminRemark: 'Case rejected: Non-municipal private dispute.',
      imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80',
      resolutionImageUrl: '',
      createdIso: '2026-09-28T11:20:00.000Z',
      rejectedAt: '2026-09-29T10:00:00.000Z',
      timeline: [
        { status: 'Submitted', time: '28 Sep 2026, 11:20 AM' },
        { status: 'Rejected', time: '29 Sep 2026, 10:00 AM', remark: 'Rejected by Dept Head: Non-municipal private jurisdiction.' },
      ],
    },
  ];

  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
  return initial.map((item) => ({
    ...item,
    createdAt: {
      toDate: () => new Date(item.createdIso),
      seconds: Math.floor(new Date(item.createdIso).getTime() / 1000),
    },
  }));
}

function saveDemoStore(items) {
  const serializable = items.map((i) => ({
    ...i,
    createdIso: i.createdIso || (i.createdAt?.toDate ? i.createdAt.toDate().toISOString() : new Date().toISOString()),
  }));
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(serializable));
}

// Unified Service API
export const grievanceService = {
  // Fetch grievances according to role / user
  async getGrievances({ user, role, departmentId } = {}) {
    const isDemo = user?.isDemo || !user?.uid || user?.uid?.startsWith('demo-');
    if (isDemo) {
      const all = getDemoStore();
      if (role === 'citizen') {
        return all.filter((g) => !g.citizenId || g.citizenId === user?.uid || g.citizenId === 'demo-citizen-01' || g.citizenId === 'demo-citizen-02');
      }
      if (role === 'officer') {
        return all.filter((g) => !user?.uid || g.assignedOfficerId === user?.uid || !g.assignedOfficerId || g.assignedOfficerId === 'demo-officer-01');
      }
      if (role === 'department_head') {
        return all.filter((g) => !departmentId || g.departmentId === departmentId || g.department === departmentId);
      }
      // Admin sees everything
      return all;
    }

    // Real Firebase Mode
    let q;
    if (role === 'citizen') {
      q = query(collection(db, 'grievances'), where('citizenId', '==', user.uid));
    } else if (role === 'officer' && user?.uid) {
      q = query(collection(db, 'grievances'), where('assignedOfficerId', '==', user.uid));
    } else {
      q = collection(db, 'grievances');
    }

    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return list;
  },

  // Get single grievance
  async getGrievanceById(id, user) {
    const isDemo = user?.isDemo || !user?.uid || user?.uid?.startsWith('demo-');
    if (isDemo) {
      const all = getDemoStore();
      const found = all.find((g) => g.id === id || g.complaintId === id);
      return found || null;
    }

    try {
      const snap = await getDoc(doc(db, 'grievances', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch {
      // Fallback to demo store
    }
    const all = getDemoStore();
    return all.find((g) => g.id === id || g.complaintId === id) || null;
  },

  // Create new grievance
  async createGrievance(data, user, profile) {
    const complaintId = `GRV-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const isDemo = user?.isDemo || !user?.uid || user?.uid?.startsWith('demo-');
    if (isDemo) {
      const all = getDemoStore();
      const newEntry = {
        id: `demo-grv-${Date.now()}`,
        complaintId,
        citizenId: user?.uid || 'demo-citizen-01',
        citizenName: profile?.name || user?.displayName || 'Aarav Patel',
        citizenEmail: profile?.email || user?.email || 'aarav.citizen@jansewa.gov.in',
        category: data.category,
        subcategory: data.subcategory || '',
        subject: data.subject.trim(),
        description: data.description.trim(),
        location: data.location || 'Local Area',
        priority: data.priority || 'Medium',
        department: data.department || '',
        departmentId: data.department || null,
        assignedOfficerId: null,
        assignedOfficerName: null,
        status: 'Submitted',
        adminRemark: '',
        imageUrl: data.imageUrl || '',
        resolutionImageUrl: '',
        createdIso: new Date().toISOString(),
        timeline: [
          {
            status: 'Submitted',
            time: formatDateTime(new Date()),
          },
        ],
      };
      all.unshift(newEntry);
      saveDemoStore(all);
      return newEntry;
    }

    // Real Firebase
    const ref = doc(collection(db, 'grievances'));
    const docData = {
      complaintId,
      citizenId: user.uid,
      citizenName: profile?.name || user.displayName || 'Citizen',
      citizenEmail: profile?.email || user.email,
      category: data.category,
      subcategory: data.subcategory || '',
      subject: data.subject.trim(),
      description: data.description.trim(),
      location: data.location.trim(),
      priority: data.priority || 'Medium',
      imageUrl: data.imageUrl || '',
      resolutionImageUrl: '',
      department: data.department || '',
      status: 'Submitted',
      adminRemark: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timeline: [{ status: 'Submitted', at: Timestamp.now() }],
    };
    await setDoc(ref, docData);
    return { id: ref.id, ...docData };
  },

  // Update grievance (status, department, officer, remark, resolution proof photo)
  async updateGrievance(id, updates, user) {
    const isDemo = user?.isDemo || !user?.uid || user?.uid?.startsWith('demo-');
    if (isDemo) {
      const all = getDemoStore();
      const idx = all.findIndex((g) => g.id === id || g.complaintId === id);
      if (idx !== -1) {
        const timelineAddition = updates.customTimelineEntry
          ? [updates.customTimelineEntry]
          : updates.status && updates.status !== all[idx].status
          ? [{ status: updates.status, time: formatDateTime(new Date()), remark: updates.adminRemark || '' }]
          : [];

        all[idx] = {
          ...all[idx],
          ...updates,
          timeline: [
            ...all[idx].timeline,
            ...timelineAddition,
          ],
        };
        saveDemoStore(all);
        return all[idx];
      }
      return null;
    }

    try {
      // Real Firebase
      const ref = doc(db, 'grievances', id);
      await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Fallback to local demo store
      const all = getDemoStore();
      const idx = all.findIndex((g) => g.id === id || g.complaintId === id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...updates };
        saveDemoStore(all);
      }
    }
  },
};
