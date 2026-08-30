
import React from 'react';
import { Role } from '../types';
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  CheckSquare,
  ShieldCheck,
  Users,
  Building2,
  Fingerprint,
  Target,
  BookOpen,
  Inbox,
  Activity,
  Lock,
  Server
} from 'lucide-react';
import { NITECHSPARK_LOGO, COMPANY_NAME, APP_NAME } from '../constants';

interface SidebarProps {
  role: Role;
  department: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, department, activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'admin', label: 'Admin Panel', icon: Users, roles: [Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'audits', label: 'Audits & Scope', icon: Target, roles: [Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER, Role.HR] },
    { id: 'frameworks', label: 'Framework Library', icon: BookOpen, roles: [Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.MANAGER, Role.HR] },
    { id: 'governance', label: 'Governance & Risk', icon: ShieldCheck, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'requests', label: 'Evidence Requests', icon: Inbox, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'testing', label: 'Control Testing & Sampling', icon: Activity, roles: [Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'dpdp', label: 'DPDP Privacy Hub', icon: Lock, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'assets', label: 'Assets & Vendor Risk', icon: Server, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'dept_hub', label: `${department} Hub`, icon: Building2, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'checklists', label: 'My Checklists', icon: ClipboardCheck, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'capa', label: 'CAPA Reports', icon: FileText, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'approvals', label: 'Audit Inbox', icon: CheckSquare, roles: [Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'executive', label: 'Compliance Sign-off', icon: ShieldCheck, roles: [Role.EXTERNAL_AUDITOR, Role.INTERNAL_AUDITOR, Role.SUPER_ADMIN, Role.ORG_ADMIN] },
    { id: 'auditlog', label: 'Audit Log', icon: Fingerprint, roles: [Role.SUPER_ADMIN, Role.EXTERNAL_AUDITOR, Role.INTERNAL_AUDITOR, Role.ORG_ADMIN, Role.MANAGER, Role.HR, Role.TEAM_LEAD] },
  ];

  const isRoleAllowed = (allowedRoles: Role[], userRole: Role | string) => {
    if (allowedRoles.includes(userRole as Role)) return true;
    const r = (userRole || '').toString().toLowerCase();
    if ((r.includes('manager') || r.includes('hr') || r.includes('lead')) && (allowedRoles.includes(Role.MANAGER) || allowedRoles.includes(Role.HR) || allowedRoles.includes(Role.TEAM_LEAD))) return true;
    if (r.includes('auditor') && (allowedRoles.includes(Role.INTERNAL_AUDITOR) || allowedRoles.includes(Role.EXTERNAL_AUDITOR))) return true;
    if (r.includes('admin') && (allowedRoles.includes(Role.SUPER_ADMIN) || allowedRoles.includes(Role.ORG_ADMIN))) return true;
    if ((r.includes('contributor') || r.includes('staff')) && allowedRoles.includes(Role.CONTRIBUTOR)) return true;
    return false;
  };

  const filteredItems = menuItems.filter(item => isRoleAllowed(item.roles, role));

  return (
    <div className="w-64 bg-slate-950/40 backdrop-blur-xl border-r border-white/5 text-white flex flex-col sticky top-0 h-screen z-50">
      <div className="p-6 flex flex-col gap-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-center animate-in fade-in duration-700">
          <img
            src={NITECHSPARK_LOGO}
            alt={`${COMPANY_NAME} Logo`}
            className="h-16 w-auto object-contain scale-125 mix-blend-screen"
          />
        </div>
        <div className="text-center px-2">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block">{APP_NAME}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${activeTab === item.id
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1'
              : 'text-slate-400 hover:bg-white/[0.05] hover:text-white hover:translate-x-1'
              }`}
          >
            <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 Transition-colors'} />
            <span className="font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <p className="text-[9px] text-slate-500 font-medium text-center uppercase tracking-widest">
          &copy; 2026 All rights reserved by NITECHSPARK
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
