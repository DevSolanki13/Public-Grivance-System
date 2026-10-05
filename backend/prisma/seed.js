import { PrismaClient } from '@prisma/client';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_CATEGORIES,
  INITIAL_USERS,
  INITIAL_GRIEVANCES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../db.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting JanSewa Supabase database seeding via Prisma...');

  // 1. Departments
  console.log('1/6 Seeding departments...');
  for (const dept of INITIAL_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: { ...dept },
      create: { ...dept },
    });
  }

  // 2. Categories
  console.log('2/6 Seeding categories...');
  for (const cat of INITIAL_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        departmentId: cat.departmentId,
        slaHours: cat.slaHours,
        subcategories: cat.subcategories,
      },
      create: {
        id: cat.id,
        name: cat.name,
        departmentId: cat.departmentId,
        slaHours: cat.slaHours,
        subcategories: cat.subcategories,
      },
    });
  }

  // 3. Users
  console.log('3/6 Seeding users...');
  for (const user of INITIAL_USERS) {
    const { rawPassword, ...userData } = user;
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...userData },
      create: { ...userData },
    });
  }

  // 4. Grievances
  console.log('4/6 Seeding grievances...');
  for (const grv of INITIAL_GRIEVANCES) {
    await prisma.grievance.upsert({
      where: { complaintId: grv.complaintId },
      update: {
        citizenId: grv.citizenId,
        citizenName: grv.citizenName,
        citizenEmail: grv.citizenEmail,
        citizenPhone: grv.citizenPhone,
        categoryId: grv.categoryId,
        category: grv.category,
        subcategoryId: grv.subcategoryId,
        subcategory: grv.subcategory,
        subject: grv.subject,
        description: grv.description,
        priority: grv.priority,
        status: grv.status,
        departmentId: grv.departmentId,
        department: grv.department,
        assignedOfficerId: grv.assignedOfficerId,
        assignedOfficerName: grv.assignedOfficerName,
        assignedAt: grv.assignedAt ? new Date(grv.assignedAt) : null,
        slaHours: grv.slaHours,
        slaStartedAt: new Date(grv.slaStartedAt),
        slaDeadline: new Date(grv.slaDeadline),
        isOverdue: grv.isOverdue || false,
        isEscalated: grv.isEscalated || false,
        adminRemark: grv.adminRemark || null,
        evidence: grv.evidence || [],
        resolution: grv.resolution || null,
        verification: grv.verification || null,
        feedback: grv.feedback || null,
        location: grv.location || {},
        timeline: grv.timeline || [],
        createdAt: new Date(grv.createdAt),
        updatedAt: new Date(grv.updatedAt),
      },
      create: {
        id: grv.id,
        complaintId: grv.complaintId,
        citizenId: grv.citizenId,
        citizenName: grv.citizenName,
        citizenEmail: grv.citizenEmail,
        citizenPhone: grv.citizenPhone,
        categoryId: grv.categoryId,
        category: grv.category,
        subcategoryId: grv.subcategoryId,
        subcategory: grv.subcategory,
        subject: grv.subject,
        description: grv.description,
        priority: grv.priority,
        status: grv.status,
        departmentId: grv.departmentId,
        department: grv.department,
        assignedOfficerId: grv.assignedOfficerId,
        assignedOfficerName: grv.assignedOfficerName,
        assignedAt: grv.assignedAt ? new Date(grv.assignedAt) : null,
        slaHours: grv.slaHours,
        slaStartedAt: new Date(grv.slaStartedAt),
        slaDeadline: new Date(grv.slaDeadline),
        isOverdue: grv.isOverdue || false,
        isEscalated: grv.isEscalated || false,
        adminRemark: grv.adminRemark || null,
        evidence: grv.evidence || [],
        resolution: grv.resolution || null,
        verification: grv.verification || null,
        feedback: grv.feedback || null,
        location: grv.location || {},
        timeline: grv.timeline || [],
        createdAt: new Date(grv.createdAt),
        updatedAt: new Date(grv.updatedAt),
      },
    });
  }

  // 5. Notifications
  console.log('5/6 Seeding notifications...');
  for (const notif of INITIAL_NOTIFICATIONS) {
    await prisma.notification.upsert({
      where: { id: notif.id },
      update: {
        userId: notif.userId,
        title: notif.title,
        message: notif.message,
        type: notif.type || 'info',
        isRead: notif.isRead || false,
        grievanceId: notif.grievanceId || null,
      },
      create: {
        id: notif.id,
        userId: notif.userId,
        title: notif.title,
        message: notif.message,
        type: notif.type || 'info',
        isRead: notif.isRead || false,
        grievanceId: notif.grievanceId || null,
        createdAt: new Date(notif.timestamp || notif.createdAt || Date.now()),
      },
    });
  }

  // 6. Audit Logs
  console.log('6/6 Seeding audit logs...');
  for (const log of INITIAL_AUDIT_LOGS) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: {
        action: log.action,
        grievanceId: log.grievanceId || null,
        complaintId: log.complaintId || null,
        performedBy: log.performedBy || 'System',
        performedByRole: log.performedByRole || 'admin',
        details: log.details || log.description || '',
      },
      create: {
        id: log.id,
        action: log.action,
        grievanceId: log.grievanceId || null,
        complaintId: log.complaintId || null,
        performedBy: log.performedBy || 'System',
        performedByRole: log.performedByRole || 'admin',
        details: log.details || log.description || '',
        timestamp: new Date(log.timestamp || Date.now()),
      },
    });
  }

  console.log('✅ JanSewa Supabase database successfully seeded with all initial records!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
