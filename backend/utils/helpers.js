/**
 * Server Helper Utilities
 */

export function generateComplaintId(existingGrievances = []) {
  const year = new Date().getFullYear();
  const existingSet = new Set(
    (existingGrievances || []).map((g) => (g.complaintId || '').toUpperCase())
  );

  let complaintId;
  let attempts = 0;
  do {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    complaintId = `GRV-${year}-${randomNum}`;
    attempts++;
  } while (existingSet.has(complaintId) && attempts < 100);

  return complaintId;
}

export function generateNotificationId() {
  return `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function generateAuditLogId() {
  return `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
