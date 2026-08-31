import React from 'react';
import { Department, ChecklistItem, User, Role, AuditStatus } from './types';

export const APP_NAME = "SparkAudit";
export const COMPANY_NAME = "NitechSpark";
export const COMPANY_TAGLINE = "Empowering Compliance Through Digital Excellence";
export const NITECHSPARK_LOGO = "/logo.png";

export const SparkAuditBrandLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; showSubtitle?: boolean }> = ({ size = 'md', showSubtitle = true }) => {
  const iconSizes = { sm: 32, md: 42, lg: 56 };
  const s = iconSizes[size];

  return (
    <div className="flex items-center gap-3 select-none group">
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-all duration-500"></div>
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-xl transition-transform duration-500 group-hover:scale-105">
          <defs>
            <linearGradient id="sparkGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="sparkGradAccent" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Shield Outer Frame */}
          <path d="M32 4L54 14V30C54 44.4 44.6 57.5 32 60C19.4 57.5 10 44.4 10 30V14L32 4Z" fill="url(#sparkGradPrimary)" fillOpacity="0.25" stroke="url(#sparkGradPrimary)" strokeWidth="2.5" strokeLinejoin="round" />
          
          {/* Inner Compliance Core Shield */}
          <path d="M32 10L48 18V30C48 40.5 41.2 50.1 32 52.5C22.8 50.1 16 40.5 16 30V18L32 10Z" fill="url(#sparkGradPrimary)" fillOpacity="0.85" />
          
          {/* Central Spark & Checkmark Motif */}
          <path d="M25 31L30 36L41 23" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 16V20M32 42V46M20 32H24M40 32H44" stroke="url(#sparkGradAccent)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className={`font-black tracking-tight text-white uppercase flex items-center gap-1 ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'}`}>
          SPARK<span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent font-extrabold">AUDIT</span>
        </span>
        {showSubtitle && (
          <span className="text-[9px] font-black text-cyan-400/80 uppercase tracking-[0.3em] -mt-1">
            Enterprise GRC Platform
          </span>
        )}
      </div>
    </div>
  );
};

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
