/**
 * Grievance Data Model Schema
 * Represents the structure and lifecycle states of a civic grievance in JanSewa.
 */
export const GrievanceSchema = {
  id: String,
  complaintId: String,          // e.g. "GRV-2026-00125"
  citizenId: String,            // UID of the citizen who filed the report
  citizenName: String,
  citizenEmail: String,
  citizenPhone: String,
  
  // Categorization & Details
  category: String,             // e.g. "Sanitation", "Road & Infrastructure", "Water Supply"
  subcategory: String,
  subject: String,
  description: String,
  location: String,             // Human-readable address
  coordinates: {
    lat: Number,
    lng: Number
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  // Department & Field Assignment
  department: String,           // e.g. "Sanitation Department", "PWD"
  assignedOfficerId: String,    // UID of dispatched field personnel
  assignedOfficerName: String,
  adminRemark: String,
  
  // Current Status Lifecycle
  status: {
    type: String,
    enum: [
      'Submitted',
      'Under Review',
      'In Progress',
      'Resolved',
      'Closed',
      'Reopened',
      'Rejected'
    ],
    default: 'Submitted'
  },
  
  // Evidence Photos (Before & After)
  imageUrl: String,             // Initial problem photo uploaded by citizen
  resolutionImageUrl: String,   // After-repair photo uploaded by field officer
  
  // Citizen Verification & Reopen Flow
  rating: Number,               // 1 to 5 stars on citizen approval
  feedbackComment: String,
  reopenReason: String,
  reopenImageUrl: String,
  
  // Timeline Milestones
  timeline: [
    {
      status: String,
      time: String,
      remark: String,
      actor: String
    }
  ],
  
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date,
  closedAt: Date
};
