
import React, { useState, useEffect } from 'react';
import { User, DMAXReport, Role, Department, ActivityLog, ActivityType } from '../types';
import {
  UserCog, UserPlus, ShieldAlert, Activity, BellRing, Mail, CheckCircle2,
  Search, Filter, X, Save, Power, PowerOff, ListRestart, History,
  ArrowRightCircle, Clock, Info, AlertTriangle, CheckCircle
} from 'lucide-react';

interface AdminPanelProps {
  dmax: DMAXReport[];
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  activities: ActivityLog[];
  user: User;
  logActivity: (user: User, action: ActivityType, description: string) => void;
  onResetPassword: (userId: string, newPassword: string) => void;
  onToggleLock: (userId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ dmax, users, setUsers, activities, user, logActivity, onResetPassword, onToggleLock }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');
  const [reminderSent, setReminderSent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const INITIAL_FORM_DATA: Partial<User> = {
    name: '',
    email: '',
    role: Role.CONTRIBUTOR,
    department: Department.OPERATIONS,
    isActive: true,
    isLocked: false,
    loginAttempts: 0,
    password: 'password123'
  };

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Robust Synchronization: Ensure formData has the latest security status from the system
  useEffect(() => {
    if (editingUser && isModalOpen) {
      const live = users.find(u => u.id === editingUser.id);
      if (live) {
        setFormData(prev => ({
          ...prev,
          isLocked: live.isLocked,
          password: live.password,
          loginAttempts: live.loginAttempts
        }));
      }
    }
  }, [users, editingUser, isModalOpen]);

  const currentMonth = "January";

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
      logActivity(user, ActivityType.STATUS_CHANGE, `Updated profile/role for: ${formData.name}`);
    } else {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...(formData as User)
      };
      setUsers(prev => [...prev, newUser]);
      logActivity(user, ActivityType.SYSTEM, `Provisioned new user: ${formData.name} as ${formData.role}`);
    }
    setFormData(INITIAL_FORM_DATA);
    setIsModalOpen(false);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">Governance <span className="text-blue-500">Console</span></h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Enterprise Security & Access Control</p>
        </div>
        <div className="flex gap-3 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            User Directory
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'activity' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[40px] border border-white/[0.08] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Query employees, roles, or nodes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all placeholder:text-slate-700"
              />
            </div>
            <button
              onClick={() => { setEditingUser(null); setFormData(INITIAL_FORM_DATA); setIsModalOpen(true); }}
              className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <UserPlus size={18} className="opacity-80" /> Provision Access
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
                  <th className="px-8 py-5">Corporate Entity</th>
                  <th className="px-8 py-5">Access Permission</th>
                  <th className="px-8 py-5">Operational Branch</th>
                  <th className="px-8 py-5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600/20 text-blue-400 flex items-center justify-center rounded-xl font-black text-sm border border-blue-500/20 shadow-lg">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{u.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5 bg-white/[0.03] text-slate-400`}>
                        {u.role}
                      </span>
                      {u.isLocked && (
                        <span className="ml-2 px-3 py-1.5 bg-red-500/10 text-red-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-red-500/20 animate-pulse">
                          Node Locked
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-400/5 px-2.5 py-1 rounded-md border border-slate-400/10">
                        {u.department}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => { setEditingUser(u); setFormData({ name: u.name, email: u.email, role: u.role, department: u.department, isActive: u.isActive, isLocked: u.isLocked, loginAttempts: u.loginAttempts, password: u.password }); setIsModalOpen(true); }}
                        className="text-[10px] font-black text-blue-400 hover:text-white hover:bg-blue-600 px-4 py-2 rounded-xl transition-all border border-blue-500/20 uppercase tracking-widest"
                      >
                        Modify Permissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 italic">Audit Log functionality is retained for system records.</div>
      )
      }

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-slate-900 border border-white/[0.08] w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 bg-white/[0.02] border-b border-white/5 relative flex items-center justify-between">
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">{editingUser ? 'Sync Entity' : 'New Provision'}</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em] mt-1">Identity & Access Management Protocol</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-3 rounded-2xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 max-h-[60vh] overflow-y-auto px-1">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Entity Class (Role)</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none"
                  >
                    {Object.values(Role).map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Full Identity Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-800" placeholder="e.g. John Doe" />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Corporate Node (Email)</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-800" placeholder="name@desicrew.in" />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Operational Sector</label>
                  <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value as Department })} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none">
                    {Object.values(Department).map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                  </select>
                </div>

                {editingUser && (() => {
                  const liveUser = users.find(u => u.id === editingUser.id) || editingUser;
                  return (
                    <div className="pt-8 border-t border-white/10 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Security Overrides</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Global access toggle</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${liveUser.isLocked ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
                      </div>

                      {isResettingPassword ? (
                        <div className="space-y-5 bg-blue-600/5 p-6 rounded-[32px] border border-blue-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] pl-1">New Node password</label>
                            <input
                              type="password"
                              autoFocus
                              placeholder="6+ char credentials"
                              value={newPasswordValue}
                              onChange={(e) => setNewPasswordValue(e.target.value)}
                              className="w-full bg-slate-950 border border-blue-500/30 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (newPasswordValue.length >= 6) {
                                  onResetPassword(liveUser.id, newPasswordValue);
                                  setIsResettingPassword(false);
                                  setNewPasswordValue('');
                                  alert('System Trace: Password Encrypted Successfully.');
                                } else {
                                  alert('Input Error: Password requires 6+ characters.');
                                }
                              }}
                              className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
                            >
                              Finalize Reset
                            </button>
                            <button
                              type="button"
                              onClick={() => { setIsResettingPassword(false); setNewPasswordValue(''); }}
                              className="px-6 bg-white/5 border border-white/10 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                              Abort
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => onToggleLock(liveUser.id)}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${liveUser.isLocked
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-500/20'
                              : 'bg-white/5 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white shadow-xl hover:shadow-red-500/20'}`}
                          >
                            {liveUser.isLocked ? <Power size={16} /> : <PowerOff size={16} />}
                            {liveUser.isLocked ? 'Enable Node' : 'Lock Node'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsResettingPassword(true)}
                            className="flex-1 flex items-center justify-center gap-3 py-4 px-4 rounded-2xl border border-blue-500/20 bg-blue-600/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-xl hover:shadow-blue-500/20"
                          >
                            <History size={16} /> Reset Keys
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl mt-4 hover:bg-blue-500 shadow-2xl shadow-blue-500/30 text-xs uppercase tracking-[0.4em] transition-all active:scale-[0.98]">Push configuration</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
