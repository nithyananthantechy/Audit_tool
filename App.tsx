
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, Department, Evidence, DMAXReport, AuditStatus, ActivityLog, ActivityType, ChecklistItem } from './types';
import { MOCK_USERS, APP_NAME, DEPARTMENT_CHECKLISTS } from './constants';
import { api } from './api';
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
  const [loginState, setLoginState] = useState<'landing' | 'login' | 'welcome' | 'active'>('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [evidenceStore, setEvidenceStore] = useState<Evidence[]>([]);
  const [dmaxStore, setDmaxStore] = useState<DMAXReport[]>([]);
  const [userStore, setUserStore] = useState<User[]>([]);
  const [activityStore, setActivityStore] = useState<ActivityLog[]>([]);
  const [checklistStore, setChecklistStore] = useState<ChecklistItem[]>(DEPARTMENT_CHECKLISTS);

  useEffect(() => {
    document.title = currentUser ? `${APP_NAME} | ${currentUser.name}` : APP_NAME;
  }, [currentUser]);

  useEffect(() => {
    const fetchData = async () => {
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
    };
    fetchData();
  }, []);

  // Removed localStorage sync effect

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
    // Optimistic update
    setActivityStore(prev => [newLog, ...prev].slice(0, 1000));
    try {
      await api.logActivity(newLog);
    } catch (e) {
      console.error("Failed to log activity", e);
    }
  }, []);

  const handleLogin = (email: string, password?: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    // Try to find user in store
    let user = userStore.find(u => u.email.trim().toLowerCase() === trimmedEmail);

    // Fallback: Check MOCK_USERS
    if (!user) {
      user = MOCK_USERS.find(u => u.email.toLowerCase() === trimmedEmail);
      if (user) {
        setUserStore(prev => [...prev, user!]);
      }
    }

    if (user) {
      // Check if account is locked
      if (user.isLocked) {
        alert('This account has been locked due to too many failed login attempts. Please contact the Super Admin to unlock your account.');
        logActivity(user, ActivityType.SYSTEM, `Blocked login attempt on locked account: ${user.email}`);
        return false;
      }

      if (!user.isActive) {
        alert('This account has been disabled. Please contact the Super Admin.');
        return false;
      }

      // Strict Password Validation
      const inputPassword = (password || '').trim();
      const storedPassword = (user.password || 'password123').trim();

      if (inputPassword !== storedPassword) {
        const attempts = (user.loginAttempts || 0) + 1;
        const remaining = 3 - attempts;

        setUserStore(prev => prev.map(u => u.id === user!.id ? {
          ...u,
          loginAttempts: attempts,
          isLocked: attempts >= 3
        } : u));

        if (attempts >= 3) {
          alert('Too many failed attempts. Your account has been locked for security. Please contact the Super Admin.');
          logActivity(user, ActivityType.SYSTEM, `Account locked due to 3 failed attempts: ${user.email}`);
        } else {
          alert(`Invalid password. ${remaining} attempts remaining before account lockout.`);
        }
        return false;
      }

      setCurrentUser(user);
      setLoginState('welcome');

      // Reset login attempts on success
      setUserStore(prev => prev.map(u => u.id === user!.id ? { ...u, loginAttempts: 0 } : u));

      logActivity(user, ActivityType.LOGIN, `User logged into the compliance portal.`);

      setTimeout(() => {
        setLoginState('active');
        if (user!.role === Role.SUPER_ADMIN) setActiveTab('admin');
        else if (user!.role === Role.EXTERNAL_AUDITOR) setActiveTab('executive');
        else if (user!.role === Role.INTERNAL_AUDITOR) setActiveTab('approvals');
        else setActiveTab('dashboard');
      }, 2000);
      return true;

    } else {
      alert(`Invalid user. For this demo, try admin@desicrew.in`);
      return false;
    }
  };

  const handleResetUserPassword = async (userId: string, newPassword: string) => {
    const targetUser = userStore.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUser = { ...targetUser, password: newPassword };
    setUserStore(prev => prev.map(u => u.id === userId ? updatedUser : u));

    try {
      await api.updateUser(updatedUser);
      if (currentUser) {
        logActivity(currentUser, ActivityType.SYSTEM, `Admin reset password for: ${targetUser.name}`);
      }
    } catch (e) { console.error(e); }
  };

  const handleToggleUserLock = async (userId: string) => {
    const targetUser = userStore.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUser = { ...targetUser, isLocked: !targetUser.isLocked, loginAttempts: 0 };
    setUserStore(prev => prev.map(u => u.id === userId ? updatedUser : u));

    try {
      await api.updateUser(updatedUser);
      if (currentUser) {
        logActivity(currentUser, ActivityType.SYSTEM, `Admin ${targetUser.isLocked ? 'Unlocked' : 'Locked'} account for: ${targetUser.name}`);
      }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    if (currentUser) logActivity(currentUser, ActivityType.SYSTEM, `User signed out.`);
    setLoginState('landing');
    setCurrentUser(null);
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

  if (loginState === 'landing') return <LandingPage onLoginClick={() => setLoginState('login')} />;
  if (loginState === 'login') return <LoginPage onLogin={handleLogin} />;
  if (loginState === 'welcome' && currentUser) return <WelcomeScreen user={currentUser} />;

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={currentUser} evidence={evidenceStore} dmax={dmaxStore} />;
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
        return <Dashboard user={currentUser} evidence={evidenceStore} dmax={dmaxStore} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-white selection:bg-blue-500/30 relative overflow-hidden">
      {/* Premium Background Elements */}
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
