import React from 'react';
import { Department, ChecklistItem, User, Role, AuditStatus } from './types';

export const APP_NAME = "SparkAudit";
export const COMPANY_NAME = "NitechSpark";
export const COMPANY_TAGLINE = "Empowering Compliance Through Digital Excellence";
export const NITECHSPARK_LOGO = "/logo.png";

/* ─────────────────────────────────────────────
   SparkAuditBrandLogo — full horizontal lockup
   ───────────────────────────────────────────── */
export const SparkAuditBrandLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; showSubtitle?: boolean }> = ({
  size = 'md',
  showSubtitle = true,
}) => {
  const iconSizes = { sm: 34, md: 44, lg: 60 };
  const s = iconSizes[size];
  const uid = `sab-${size}`;

  return (
    <div className="flex items-center gap-3 select-none group cursor-default">
      {/* ── Icon mark ── */}
      <div className="relative flex-shrink-0">
        {/* outer glow halo */}
        <div className="absolute inset-0 scale-125 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-600 opacity-25 blur-xl group-hover:opacity-50 transition-all duration-700" />
        <svg
          width={s} height={s}
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
        >
          <defs>
            {/* shield face gradient */}
            <linearGradient id={`${uid}-g1`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="40%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            {/* stroke gradient */}
            <linearGradient id={`${uid}-g2`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            {/* lightning bolt gradient */}
            <linearGradient id={`${uid}-g3`} x1="28" y1="12" x2="28" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>
            <filter id={`${uid}-glow`}>
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Angular shield body */}
          <path
            d="M28 3 L50 12 L50 30 C50 41.5 40.5 51.5 28 54 C15.5 51.5 6 41.5 6 30 L6 12 Z"
            fill={`url(#${uid}-g1)`}
            fillOpacity="0.9"
          />
          {/* Shield border rim */}
          <path
            d="M28 3 L50 12 L50 30 C50 41.5 40.5 51.5 28 54 C15.5 51.5 6 41.5 6 30 L6 12 Z"
            fill="none"
            stroke={`url(#${uid}-g2)`}
            strokeWidth="1.6"
          />
          {/* Inner shield highlight top edge */}
          <path
            d="M28 8 L44 15.5 L44 30"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Lightning bolt — centre motif */}
          <path
            d="M32 13 L22 29 H29 L24 43 L37 25 H30 Z"
            fill={`url(#${uid}-g3)`}
            filter={`url(#${uid}-glow)`}
          />
        </svg>
      </div>

      {/* ── Wordmark ── */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight text-white flex items-baseline gap-0 ${
            size === 'sm' ? 'text-[18px]' : size === 'lg' ? 'text-[30px]' : 'text-[22px]'
          }`}
        >
          Spark
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
            Audit
          </span>
        </span>
        {showSubtitle && (
          <span
            className={`font-bold text-slate-400 uppercase tracking-[0.22em] ${
              size === 'sm' ? 'text-[7px] mt-0.5' : size === 'lg' ? 'text-[10px] mt-1' : 'text-[8px] mt-0.5'
            }`}
          >
            Enterprise GRC Platform
          </span>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   SparkAuditIcon — icon only (for login page header etc)
   ───────────────────────────────────────────── */
export const SparkAuditIcon: React.FC<{ size?: number }> = ({ size = 72 }) => {
  const uid = `sai-${size}`;
  return (
    <div className="relative inline-flex items-center justify-center group">
      {/* halo */}
      <div className="absolute inset-0 scale-150 bg-gradient-to-br from-blue-600 via-cyan-400 to-indigo-600 opacity-20 blur-2xl rounded-full group-hover:opacity-40 transition-all duration-700" />
      <svg
        width={size} height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_0_18px_rgba(56,189,248,0.45)] transition-transform duration-500 group-hover:scale-105"
      >
        <defs>
          <linearGradient id={`${uid}-g1`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="45%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <linearGradient id={`${uid}-g2`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>
          <linearGradient id={`${uid}-g3`} x1="28" y1="12" x2="28" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <filter id={`${uid}-glow`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path
          d="M28 3 L50 12 L50 30 C50 41.5 40.5 51.5 28 54 C15.5 51.5 6 41.5 6 30 L6 12 Z"
          fill={`url(#${uid}-g1)`}
        />
        <path
          d="M28 3 L50 12 L50 30 C50 41.5 40.5 51.5 28 54 C15.5 51.5 6 41.5 6 30 L6 12 Z"
          fill="none"
          stroke={`url(#${uid}-g2)`}
          strokeWidth="1.8"
        />
        <path
          d="M28 8 L44 15.5 L44 30"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M32 13 L22 29 H29 L24 43 L37 25 H30 Z"
          fill={`url(#${uid}-g3)`}
          filter={`url(#${uid}-glow)`}
        />
      </svg>
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
