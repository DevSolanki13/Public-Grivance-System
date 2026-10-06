/**
 * User & Role Data Model Schema
 * Enforces Role-Based Access Control (RBAC) across the 4 civic personas.
 */
export const UserSchema = {
  uid: String,
  name: String,
  email: String,
  phone: String,
  role: {
    type: String,
    enum: ['citizen', 'officer', 'department_head', 'admin'],
    default: 'citizen'
  },
  departmentId: String,       // Relevant for officers and department heads
  departmentName: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: Date
};

export const ROLES = {
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  DEPARTMENT_HEAD: 'department_head',
  ADMIN: 'admin'
};
