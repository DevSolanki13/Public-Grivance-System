export function generateComplaintId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `GRV-${year}-${randomNum}`;
}

export function generateNotificationId() {
  return `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function generateAuditLogId() {
  return `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
