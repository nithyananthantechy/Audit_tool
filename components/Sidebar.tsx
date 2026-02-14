
import React from 'react';
import { Role } from '../types';
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  CheckSquare,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { DESICREW_LOGO, COMPANY_NAME, APP_NAME } from '../constants';

interface SidebarProps {
  role: Role;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN] },
    { id: 'checklists', label: 'My Checklists', icon: ClipboardCheck, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR] },
    { id: 'dmax', label: 'DMAX Reports', icon: FileText, roles: [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR] },
    { id: 'approvals', label: 'Audit Inbox', icon: CheckSquare, roles: [Role.INTERNAL_AUDITOR] },
    { id: 'executive', label: 'Compliance Sign-off', icon: ShieldCheck, roles: [Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN] },
    { id: 'admin', label: 'Admin Panel', icon: Users, roles: [Role.SUPER_ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div className="w-64 bg-slate-950/40 backdrop-blur-xl border-r border-white/5 text-white flex flex-col sticky top-0 h-screen z-50">
      <div className="p-6 flex flex-col gap-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-center animate-in fade-in duration-700">
          <img
            src={DESICREW_LOGO}
            alt={`${COMPANY_NAME} Logo`}
            className="h-10 w-auto object-contain filter brightness-0 invert opacity-90"
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
    </div>
  );
};

export default Sidebar;
