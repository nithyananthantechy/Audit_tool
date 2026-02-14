
import { Department, ChecklistItem, User, Role, AuditStatus } from './types';

export const APP_NAME = "Compliance & Audit Portal";
export const COMPANY_NAME = "DesiCrew Solutions Private Limited";
export const COMPANY_TAGLINE = "Empowering Compliance Through Digital Excellence";
export const DESICREW_LOGO = "logo.png";

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'System Admin',
    email: 'admin@desicrew.in',
    role: Role.SUPER_ADMIN,
    department: Department.ADMIN,
    isActive: true,
    password: 'password123',
    isLocked: false,
    loginAttempts: 0,
  },
  {
    id: 'u2',
    name: 'Anjali Nair',
    email: 'anjali.n@desicrew.in',
    role: Role.INTERNAL_AUDITOR,
    department: Department.AUDIT,
    isActive: true,
    password: 'password123',
    isLocked: false,
    loginAttempts: 0,
  },
  {
    id: 'u3',
    name: 'Suresh Kumar',
    email: 'suresh.k@desicrew.in',
    role: Role.EXTERNAL_AUDITOR,
    department: Department.AUDIT,
    isActive: true,
    password: 'password123',
    isLocked: false,
    loginAttempts: 0,
  },
  {
    id: 'u4',
    name: 'Priya Sharma',
    email: 'priya.s@desicrew.in',
    role: Role.MANAGER,
    department: Department.HR,
    isActive: true,
    password: 'password123',
    isLocked: false,
    loginAttempts: 0,
  },
  {
    id: 'u5',
    name: 'Rahul Varma',
    email: 'rahul.v@desicrew.in',
    role: Role.CONTRIBUTOR,
    department: Department.OPERATIONS,
    isActive: true,
    password: 'password123',
    isLocked: false,
    loginAttempts: 0,
  }
];

export const DEPARTMENT_CHECKLISTS: ChecklistItem[] = [
  { id: 'hr1', department: Department.HR, task: 'Monthly Payroll Register Approval' },
  { id: 'hr2', department: Department.HR, task: 'New Hire Documentation Completion' },
  { id: 'hr3', department: Department.HR, task: 'Statutory Compliance (PF/ESI) Filing' },
  { id: 'it1', department: Department.IT, task: 'Server Patch Management Log' },
  { id: 'it2', department: Department.IT, task: 'Access Review Audit Trail' },
  { id: 'it3', department: Department.IT, task: 'Backup & Disaster Recovery Test' },
  { id: 'op1', department: Department.OPERATIONS, task: 'Daily Output Verification' },
  { id: 'op2', department: Department.OPERATIONS, task: 'Quality Assurance Sample Test' },
  { id: 'op3', department: Department.OPERATIONS, task: 'Shift Handover Documentation' }
];

export const STATUS_COLORS: Record<AuditStatus, string> = {
  [AuditStatus.DRAFT]: 'bg-slate-100 text-slate-600 border-slate-200',
  [AuditStatus.SUBMITTED]: 'bg-blue-50 text-blue-600 border-blue-200',
  [AuditStatus.MANAGER_APPROVED]: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  [AuditStatus.REJECTED]: 'bg-red-50 text-red-600 border-red-200',
  [AuditStatus.FINAL_AUDIT_COMPLETED]: 'bg-purple-50 text-purple-600 border-purple-200',
};
