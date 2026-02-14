
export enum Role {
  CONTRIBUTOR = 'Contributor',
  TEAM_LEAD = 'Team Lead',
  MANAGER = 'Manager',
  HR = 'HR',
  INTERNAL_AUDITOR = 'Internal Auditor',
  EXTERNAL_AUDITOR = 'External Auditor',
  SUPER_ADMIN = 'Super Admin'
}

export enum Department {
  HR = 'HR',
  IT = 'IT',
  ADMIN = 'Admin',
  OPERATIONS = 'Operations',
  AUDIT = 'Audit'
}

export enum AuditStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  MANAGER_APPROVED = 'Auditor Approved',
  REJECTED = 'Rejected',
  FINAL_AUDIT_COMPLETED = 'Certified'
}

export enum ActivityType {
  LOGIN = 'Login',
  SUBMISSION = 'Submission',
  APPROVAL = 'Approval',
  REJECTION = 'Rejection',
  STATUS_CHANGE = 'Status Change',
  PROFILE_UPDATE = 'Profile Update',
  SYSTEM = 'System'
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  department: Department;
  action: ActivityType;
  description: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  department: Department;
  isActive: boolean;
  isLocked?: boolean;
  loginAttempts?: number;
  profilePic?: string;
}

export interface ChecklistItem {
  id: string;
  department: Department;
  task: string;
}

export interface Evidence {
  id: string;
  userId: string;
  checklistItemId: string;
  department: Department;
  submissionDate: string;
  fileUrl?: string;
  comment: string;
  status: AuditStatus;
  managerComment?: string;
  cgoComment?: string;
}

export interface DMAXReport {
  id: string;
  userId: string;
  userName: string;
  department: Department;
  month: string;
  year: number;
  content: string;
  status: AuditStatus;
  submissionDate: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: string;
}
