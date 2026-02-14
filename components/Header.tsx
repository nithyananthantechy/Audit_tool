import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { COMPANY_NAME, APP_NAME } from '../constants';
import {
  Bell, Search, X, CheckCircle, AlertTriangle, Info, Camera, Save, Lock,
  ChevronDown, User as UserIcon, Key, LogOut
} from 'lucide-react';

interface HeaderProps {
  user: User;
  onUpdateProfile: (user: User) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onUpdateProfile, onLogout }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const notifyRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    profilePic: user.profilePic || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const notifications = [
    { id: '1', title: 'New DMAX Submission', message: 'IT Department submitted a new report.', type: 'info', time: '5m ago' },
    { id: '2', title: 'Audit Approved', message: 'Your HR evidence was approved by the manager.', type: 'success', time: '1h ago' },
    { id: '3', title: 'Pending Audit', message: '3 items are pending your review.', type: 'warning', time: '2h ago' },
  ];

  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || ''
    });
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ ...user, ...formData });
    setIsProfileModalOpen(false);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.password && passwordData.currentPassword !== user.password) {
      alert('Incorrect current password.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    onUpdateProfile({ ...user, password: passwordData.newPassword });
    setIsPasswordModalOpen(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    alert('Password updated successfully!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setFormData({ ...formData, profilePic: event.target.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <header className="h-16 bg-slate-950/40 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-full w-96 focus-within:bg-white/[0.06] transition-all focus-within:border-blue-500/30">
        <Search size={18} className="text-slate-500" />
        <input
          type="text"
          placeholder="Search portal assets..."
          className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-slate-600"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notifyRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 rounded-xl transition-all duration-200 ${isNotificationsOpen ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-950 animate-pulse"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors cursor-pointer group">
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{n.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-black uppercase tracking-tighter">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative flex items-center gap-3 pl-6 border-l border-white/10" ref={userMenuRef}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-white leading-tight tracking-tight">{user.name}</p>
            <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.15em] mt-0.5">{user.role} &bull; {user.department}</p>
          </div>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 group p-1 rounded-xl hover:bg-white/5 transition-all"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black border-2 border-white/10 shadow-lg overflow-hidden ring-1 ring-blue-500/30">
              {user.profilePic ? (
                <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180 text-blue-400' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-white/5 mb-1 text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Logged Workspace</p>
                <p className="text-xs font-bold text-white truncate mt-1">{user.email}</p>
              </div>
              <button
                onClick={() => { setIsProfileModalOpen(true); setIsUserMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-blue-600 hover:text-white transition-all group"
              >
                <UserIcon size={14} className="group-hover:scale-110 transition-transform" />
                <span className="uppercase tracking-widest">Access Profile</span>
              </button>
              <button
                onClick={() => { setIsPasswordModalOpen(true); setIsUserMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-blue-600 hover:text-white transition-all group"
              >
                <Key size={14} className="group-hover:scale-110 transition-transform" />
                <span className="uppercase tracking-widest">Security Keys</span>
              </button>
              <div className="h-px bg-white/5 my-1 mx-2"></div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-500 hover:text-white transition-all group"
              >
                <LogOut size={14} className="group-hover:scale-110 transition-transform" />
                <span className="uppercase tracking-widest">Terminate Session</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Profile Settings</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-slate-50 overflow-hidden flex items-center justify-center shadow-lg ring-1 ring-slate-200">
                    {formData.profilePic ? <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-5xl font-bold text-slate-200">{formData.name.charAt(0)}</span>}
                  </div>
                  <label htmlFor="profile-upload" className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer shadow-xl hover:bg-blue-700 transition-colors border-4 border-white">
                    <Camera size={18} /><input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium" required /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Corporate Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 font-medium" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Lock size={10} /> Role</label><div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-500">{user.role}</div></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Lock size={10} /> Department</label><div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-500">{user.department}</div></div>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all text-sm">Discard</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 text-sm"><Save size={18} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Security Settings</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 text-sm">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;