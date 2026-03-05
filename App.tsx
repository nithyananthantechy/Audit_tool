
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Role, Department, Evidence, DMAXReport, AuditStatus, ActivityLog, ActivityType, ChecklistItem } from './types';
import { APP_NAME, DEPARTMENT_CHECKLISTS } from './constants';
import { api } from './apiClient';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ChecklistSubmission from './components/ChecklistSubmission';
import ManagerApproval from './components/ManagerApproval';
import CEOView from './components/CEOView';
import AdminPanel from './components/AdminPanel';
import DMAXModule from './components/DMAXModule';
import LoginPage from './components/LoginPage';
import WelcomeScreen from './components/WelcomeScreen';
import LandingPage from './components/LandingPage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginState, setLoginState] = useState<'checking' | 'landing' | 'login' | 'welcome' | 'active'>('checking');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [evidenceStore, setEvidenceStore] = useState<Evidence[]>([]);
  const [dmaxStore, setDmaxStore] = useState<DMAXReport[]>([]);
  const [userStore, setUserStore] = useState<User[]>([]);
  const [activityStore, setActivityStore] = useState<ActivityLog[]>([]);
  const [checklistStore, setChecklistStore] = useState<ChecklistItem[]>(DEPARTMENT_CHECKLISTS);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    document.title = currentUser ? `${APP_NAME} | ${currentUser.name}` : APP_NAME;
  }, [currentUser]);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getData();
      if (data.users) setUserStore(data.users);
      if (data.evidence) setEvidenceStore(data.evidence);
      if (data.dmax) setDmaxStore(data.dmax);
      if (data.activity) setActivityStore(data.activity);
      if (data.checklists) setChecklistStore(data.checklists);
    } catch (error) {
      console.error("Failed to load data from server:", error);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      loadData();
    }, 10000); // Poll every 10 seconds for live updates
  }, [loadData]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // On app load: check if a session already exists (survives refresh)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const result = await api.me();
        if (result.user) {
          setCurrentUser(result.user);
          setLoginState('active');
          loadData();
          startPolling();

          // Set the right default tab
          const role = result.user.role;
          if (role === Role.SUPER_ADMIN) setActiveTab('admin');
          else if (role === Role.EXTERNAL_AUDITOR) setActiveTab('executive');
          else if (role === Role.INTERNAL_AUDITOR) setActiveTab('approvals');
          else setActiveTab('dashboard');
        } else {
          setLoginState('landing');
        }
      } catch {
        setLoginState('landing');
      }
    };
    checkSession();

    return () => stopPolling();
  }, [loadData, startPolling, stopPolling]);

  const logActivity = useCallback(async (user: User, action: ActivityType, description: string) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      department: user.department,
      action,
      description,
      timestamp: new Date().toLocaleString()
    };
    setActivityStore(prev => [newLog, ...prev].slice(0, 1000));
    try {
      await api.logActivity(newLog);
    } catch (e) {
      console.error("Failed to log activity", e);
    }
  }, []);

  const handleLogin = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await api.login(email, password || '');
      if (result.error) {
        return { success: false, error: result.error };
      }
      if (result.user) {
        setCurrentUser(result.user);
        setLoginState('welcome');
        await loadData();
        startPolling();
        logActivity(result.user, ActivityType.LOGIN, `User logged into the compliance portal.`);
        setTimeout(() => {
          setLoginState('active');
          const role = result.user.role;
          if (role === Role.SUPER_ADMIN) setActiveTab('admin');
          else if (role === Role.EXTERNAL_AUDITOR) setActiveTab('executive');
          else if (role === Role.INTERNAL_AUDITOR) setActiveTab('approvals');
          else setActiveTab('dashboard');
        }, 2000);
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: 'Login failed. Please check your connection.' };
    }
    return { success: false, error: 'Unknown authentication error.' };
  };

  const handleResetUserPassword = async (userId: string, newPassword: string) => {
    const targetUser = userStore.find(u => u.id === userId);
    if (!targetUser) return;
    const updatedUser = { ...targetUser, password: newPassword };
    setUserStore(prev => prev.map(u => u.id === userId ? updatedUser : u));
    try {
      await api.updateUser(updatedUser);
      if (currentUser) logActivity(currentUser, ActivityType.SYSTEM, `Admin reset password for: ${targetUser.name}`);
    } catch (e) { console.error(e); }
  };

  const handleToggleUserLock = async (userId: string) => {
    const targetUser = userStore.find(u => u.id === userId);
    if (!targetUser) return;
    const updatedUser = { ...targetUser, isLocked: !targetUser.isLocked, loginAttempts: 0 };
    setUserStore(prev => prev.map(u => u.id === userId ? updatedUser : u));
    try {
      await api.updateUser(updatedUser);
      if (currentUser) logActivity(currentUser, ActivityType.SYSTEM, `Admin ${targetUser.isLocked ? 'Unlocked' : 'Locked'} account for: ${targetUser.name}`);
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    if (currentUser) logActivity(currentUser, ActivityType.SYSTEM, `User signed out.`);
    stopPolling();
    try { await api.logout(); } catch { }
    setLoginState('landing');
    setCurrentUser(null);
    setEvidenceStore([]);
    setDmaxStore([]);
    setUserStore([]);
    setActivityStore([]);
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    setUserStore(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    try {
      await api.updateUser(updatedUser);
      logActivity(updatedUser, ActivityType.PROFILE_UPDATE, `User updated their profile information.`);
    } catch (e) {
      console.error(e);
      alert("Failed to save profile on server");
    }
  };

  if (loginState === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Restoring Session...</p>
        </div>
      </div>
    );
  }

  if (loginState === 'landing') return <LandingPage onLoginClick={() => setLoginState('login')} />;
  if (loginState === 'login') return <LoginPage onLogin={handleLogin} />;
  if (loginState === 'welcome' && currentUser) return <WelcomeScreen user={currentUser} />;

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={currentUser} evidence={evidenceStore} dmax={dmaxStore} checklists={checklistStore} users={userStore} />;
      case 'checklists':
        return <ChecklistSubmission user={currentUser} evidence={evidenceStore} setEvidence={setEvidenceStore} logActivity={logActivity} checklists={checklistStore} />;
      case 'dmax':
        return <DMAXModule user={currentUser} reports={dmaxStore} setReports={setDmaxStore} logActivity={logActivity} />;
      case 'approvals':
        return <ManagerApproval user={currentUser} evidence={evidenceStore} setEvidence={setEvidenceStore} dmax={dmaxStore} setDmax={setDmaxStore} logActivity={logActivity} />;
      case 'executive':
        return <CEOView evidence={evidenceStore} dmax={dmaxStore} setEvidence={setEvidenceStore} setDmax={setDmaxStore} user={currentUser} logActivity={logActivity} />;
      case 'admin':
        return <AdminPanel dmax={dmaxStore} users={userStore} setUsers={setUserStore} activities={activityStore} user={currentUser} logActivity={logActivity} onResetPassword={handleResetUserPassword} onToggleLock={handleToggleUserLock} checklists={checklistStore} setChecklists={setChecklistStore} />;
      default:
        return <Dashboard user={currentUser} evidence={evidenceStore} dmax={dmaxStore} checklists={checklistStore} users={userStore} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white selection:bg-blue-500/30 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex w-full">
        {currentUser && (
          <Sidebar
            role={currentUser.role}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />
        )}
        <div className="flex-1 flex flex-col">
          {currentUser && <Header user={currentUser} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} />}
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
