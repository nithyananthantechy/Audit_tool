import { Department, ChecklistItem, User, Role, AuditStatus } from './types';

export const APP_NAME = "SparkAudit";
export const COMPANY_NAME = "NitechSpark";
export const COMPANY_TAGLINE = "Empowering Compliance Through Digital Excellence";
export const NITECHSPARK_LOGO = "/logo.png";

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'System Admin',
    email: 'admin@nitechspark.com',
    role: Role.SUPER_ADMIN,
    department: Department.ADMIN,
    isActive: true,
    isLocked: false,
    loginAttempts: 0,
  },
  {
    id: 'u2',
    name: 'Anjali Nair',
    email: 'anjali.n@nitechspark.com',
    role: Role.INTERNAL_AUDITOR,
    department: Department.AUDIT,
    isActive: true,
    isLocked: false,
    loginAttempts: 0,
  },
  {
    id: 'u3',
    name: 'Suresh Kumar',
    email: 'suresh.k@nitechspark.com',
    role: Role.EXTERNAL_AUDITOR,
    department: Department.AUDIT,
    isActive: true,
    isLocked: false,
    loginAttempts: 0,
  },
  {
    id: 'u4',
    name: 'Priya Sharma',
    email: 'priya.s@nitechspark.com',
    role: Role.MANAGER,
    department: Department.HR,
    isActive: true,
    isLocked: false,
    loginAttempts: 0,
  },
  {
    id: 'u5',
    name: 'Rahul Varma',
    email: 'rahul.v@nitechspark.com',
    role: Role.CONTRIBUTOR,
    department: Department.OPERATIONS,
    isActive: true,
    isLocked: false,
    loginAttempts: 0,
  }
];

export const DEPARTMENT_CHECKLISTS: ChecklistItem[] = [
  { id: 'hr1', department: Department.HR, task: 'Monthly Payroll Register Approval', framework: 'ISO 9001', control_clause: 'Clause 7.1.2' },
  { id: 'hr2', department: Department.HR, task: 'New Hire Documentation Completion', framework: 'ISO 27001', control_clause: 'A.7.1.1' },
  { id: 'hr3', department: Department.HR, task: 'Statutory Compliance (PF/ESI) Filing', framework: 'Statutory', control_clause: 'Sec. 6' },
  { id: 'it1', department: Department.IT, task: 'Server Patch Management Log', framework: 'ISO 27001', control_clause: 'A.12.6.1' },
  { id: 'it2', department: Department.IT, task: 'Access Review Audit Trail', framework: 'SOC 2', control_clause: 'CC6.2' },
  { id: 'it3', department: Department.IT, task: 'Backup & Disaster Recovery Test', framework: 'ISO 27001', control_clause: 'A.12.3.1' },
  { id: 'op1', department: Department.OPERATIONS, task: 'Daily Output Verification', framework: 'ISO 9001', control_clause: 'Clause 8.5.1' },
  { id: 'op2', department: Department.OPERATIONS, task: 'Quality Assurance Sample Test', framework: 'ISO 9001', control_clause: 'Clause 8.6' },
  { id: 'op3', department: Department.OPERATIONS, task: 'Shift Handover Documentation', framework: 'Internal', control_clause: 'SOP-OP-04' }
];

export const STATUS_COLORS: Record<AuditStatus | string, string> = {
  [AuditStatus.DRAFT]: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  [AuditStatus.SUBMITTED]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [AuditStatus.MANAGER_APPROVED]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [AuditStatus.REJECTED]: 'bg-red-500/10 text-red-400 border-red-500/20',
  [AuditStatus.FINAL_AUDIT_COMPLETED]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};
