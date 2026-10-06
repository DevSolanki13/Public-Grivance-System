/**
 * Grievance Controller
 * Encapsulates the core municipal grievance lifecycle logic:
 * - Submission (Citizen)
 * - Triage & Officer Assignment (Dept Head / Admin)
 * - Field Resolution Proof (Field Officer)
 * - Citizen Verification & Star Rating (Citizen)
 */

// In-memory data store for the backend server demonstration
let grievancesStore = [
  {
    id: 'grv-001',
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
    assignedOfficerId: 'demo-officer-01',
    assignedOfficerName: 'Rahul Sharma',
    status: 'In Progress',
    adminRemark: 'Sanitation crew dispatched with collection vehicle.',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    resolutionImageUrl: '',
    createdAt: new Date('2026-10-04T10:15:00Z'),
    timeline: [
      { status: 'Submitted', time: '04 Oct, 10:15 AM', remark: 'Complaint registered by citizen with photo evidence.' },
      { status: 'Under Review', time: '04 Oct, 11:30 AM', remark: 'Triaged by Sanitation Dept Head.' },
      { status: 'In Progress', time: '05 Oct, 09:00 AM', remark: 'Field inspection started by Rahul Sharma.' }
    ]
  },
  {
    id: 'grv-002',
    complaintId: 'GRV-2026-00118',
    citizenId: 'demo-citizen-01',
    citizenName: 'Aarav Patel',
    citizenEmail: 'aarav.citizen@jansewa.gov.in',
    category: 'Street Lights',
    subcategory: 'Light not working',
    subject: 'Street light non-functional along Highway Link',
    description: 'Street light pole near building entrance is completely dark at night.',
    location: 'Highway Link Road, Bhayandar East',
    priority: 'Medium',
    department: 'Electrical Department',
    assignedOfficerId: 'demo-officer-01',
    assignedOfficerName: 'Rahul Sharma',
    status: 'Resolved',
    adminRemark: 'New 45W LED fixture installed and tested.',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80',
    resolutionImageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date('2026-10-02T09:00:00Z'),
    timeline: [
      { status: 'Submitted', time: '02 Oct, 09:00 AM', remark: 'Filed with location tag.' },
      { status: 'Under Review', time: '02 Oct, 11:00 AM', remark: 'Assigned to Electrical Department.' },
      { status: 'In Progress', time: '03 Oct, 02:00 PM', remark: 'Officer Rahul Sharma replacing luminaire.' },
      { status: 'Resolved', time: '04 Oct, 04:30 PM', remark: 'Resolution photo uploaded. Awaiting citizen verification.' }
    ]
  }
];

export const getGrievances = async (req, res) => {
  try {
    const { role, department, status, citizenId, officerId } = req.query;
    let results = [...grievancesStore];

    if (role === 'citizen' && citizenId) {
      results = results.filter((g) => g.citizenId === citizenId);
    }
    if (role === 'officer' && officerId) {
      results = results.filter((g) => g.assignedOfficerId === officerId);
    }
    if (department) {
      results = results.filter((g) => g.department === department);
    }
    if (status) {
      results = results.filter((g) => g.status.toLowerCase() === status.toLowerCase());
    }

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGrievanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const grievance = grievancesStore.find((g) => g.id === id || g.complaintId === id);

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    res.json({ success: true, data: grievance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGrievance = async (req, res) => {
  try {
    const {
      subject,
      description,
      category,
      subcategory,
      location,
      priority,
      imageUrl,
      citizenName,
      citizenEmail
    } = req.body;

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const complaintId = `GRV-2026-${randomSuffix}`;

    const newGrievance = {
      id: `grv-${Date.now()}`,
      complaintId,
      citizenId: req.user?.uid || 'demo-citizen-01',
      citizenName: citizenName || req.user?.name || 'Aarav Patel',
      citizenEmail: citizenEmail || 'citizen@jansewa.gov.in',
      category: category || 'Sanitation',
      subcategory: subcategory || 'General',
      subject,
      description,
      location,
      priority: priority || 'Medium',
      department: '',
      assignedOfficerId: null,
      assignedOfficerName: null,
      status: 'Submitted',
      imageUrl: imageUrl || '',
      resolutionImageUrl: '',
      createdAt: new Date(),
      timeline: [
        {
          status: 'Submitted',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          remark: 'Grievance filed by citizen with location and evidence.',
          actor: 'Citizen'
        }
      ]
    };

    grievancesStore.unshift(newGrievance);

    res.status(201).json({
      success: true,
      message: 'Grievance registered successfully.',
      data: newGrievance
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateStatusAndAssign = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, department, assignedOfficerId, assignedOfficerName, adminRemark } = req.body;

    const index = grievancesStore.findIndex((g) => g.id === id || g.complaintId === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    const current = grievancesStore[index];
    if (department) current.department = department;
    if (assignedOfficerId) current.assignedOfficerId = assignedOfficerId;
    if (assignedOfficerName) current.assignedOfficerName = assignedOfficerName;
    if (status) current.status = status;
    if (adminRemark) current.adminRemark = adminRemark;

    current.timeline.push({
      status: status || current.status,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      remark: adminRemark || `Updated status to ${status || current.status}`,
      actor: 'Authority'
    });

    res.json({
      success: true,
      message: 'Grievance updated successfully.',
      data: current
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resolveGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionImageUrl, officerRemark } = req.body;

    const index = grievancesStore.findIndex((g) => g.id === id || g.complaintId === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    const current = grievancesStore[index];
    current.status = 'Resolved';
    current.resolutionImageUrl = resolutionImageUrl || '';
    current.adminRemark = officerRemark || 'Field officer completed on-site resolution.';
    current.resolvedAt = new Date();

    current.timeline.push({
      status: 'Resolved',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      remark: officerRemark || 'Field work completed; resolution photo attached for citizen sign-off.',
      actor: 'Field Officer'
    });

    res.json({
      success: true,
      message: 'Grievance marked as Resolved. Awaiting citizen verification.',
      data: current
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, rating, feedbackComment, rejectionReason, rejectionImageUrl } = req.body;

    const index = grievancesStore.findIndex((g) => g.id === id || g.complaintId === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Grievance not found.' });
    }

    const current = grievancesStore[index];

    if (approved) {
      current.status = 'Closed';
      current.rating = rating || 5;
      current.feedbackComment = feedbackComment || 'Citizen confirmed issue is resolved.';
      current.closedAt = new Date();

      current.timeline.push({
        status: 'Closed',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        remark: `Citizen confirmed resolution with ${rating || 5}/5 stars. Case officially closed.`,
        actor: 'Citizen'
      });
    } else {
      current.status = 'Reopened';
      current.reopenReason = rejectionReason || 'Citizen rejected field resolution.';
      current.reopenImageUrl = rejectionImageUrl || '';

      current.timeline.push({
        status: 'Reopened',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        remark: `Citizen requested re-inspection: "${rejectionReason || 'Work incomplete'}"`,
        actor: 'Citizen'
      });
    }

    res.json({
      success: true,
      message: approved ? 'Grievance verified and officially closed.' : 'Grievance reopened for re-inspection.',
      data: current
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
