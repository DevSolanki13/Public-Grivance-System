// Database rows are snake_case; the API returns camelCase JSON.

export function toEvent(row) {
  return {
    id: row.id,
    status: row.status,
    remark: row.remark || '',
    actor: row.actor_name || '',
    at: row.created_at,
  };
}

export function toGrievance(row) {
  if (!row) return null;
  const events = Array.isArray(row.grievance_events) ? [...row.grievance_events] : [];
  events.sort((a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id);

  return {
    id: row.id,
    complaintId: row.complaint_id,
    citizenId: row.citizen_id,
    citizenName: row.citizen_name || '',
    citizenEmail: row.citizen_email || '',
    category: row.category,
    subcategory: row.subcategory || '',
    subject: row.subject || '',
    description: row.description || '',
    location: row.location || '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    priority: row.priority || 'Medium',
    department: row.department || '',
    assignedOfficerId: row.assigned_officer_id || null,
    assignedOfficerName: row.assigned_officer_name || '',
    status: row.status,
    adminRemark: row.admin_remark || '',
    rejectionReason: row.rejection_reason || '',
    imageUrl: row.image_url || '',
    resolutionImageUrl: row.resolution_image_url || '',
    rating: row.rating ?? null,
    feedbackComment: row.feedback_comment || '',
    reopenReason: row.reopen_reason || '',
    reopenImageUrl: row.reopen_image_url || '',
    reopenedCount: row.reopened_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    rejectedAt: row.rejected_at,
    reopenedAt: row.reopened_at,
    timeline: events.map(toEvent),
  };
}

export function toProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    role: row.role,
    department: row.department || '',
    designation: row.designation || '',
    isActive: row.is_active !== false,
  };
}

export function toNotification(row) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    grievanceId: row.grievance_id,
    link: row.link,
    type: row.type || 'info',
    read: Boolean(row.read),
    createdAt: row.created_at,
  };
}

// Anonymised public transparency row (no citizen details).
export function toPublicGrievance(row) {
  return {
    id: row.complaint_id,
    complaintId: row.complaint_id,
    category: row.category,
    department: row.department || '',
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    rating: row.rating ?? null,
    subject: row.subject || '',
    location: row.location || '',
    imageUrl: row.image_url || '',
    resolutionImageUrl: row.resolution_image_url || '',
    assignedOfficerName: row.assigned_officer_name || '',
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  };
}
