import React, { useState } from 'react';
import { COMPANY_NAME, COMPANY_TAGLINE, APP_NAME, SparkAuditIcon } from '../constants';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import { api } from '../apiClient';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; mfaRequired?: boolean; userId?: string; challengeToken?: string }>;
  onVerifyMfa: (userId: string, token: string, challengeToken?: string) => Promise<{ success: boolean; error?: string }>;
}

const LoginPage: React.FC<LoginProps> = ({ onLogin, onVerifyMfa }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [mfaToken, setMfaToken] = useState('');
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (step === 1) {
      const result = await onLogin(email, password);
      setIsLoading(false);
      if (!result.success) {
        setError(result.error || 'Invalid credentials');
      } else if (result.mfaRequired) {
        setTempUserId(result.userId || null);
        setChallengeToken(result.challengeToken);
        setStep(2);
      }
    } else {
      if (onVerifyMfa && tempUserId) {
        const result = await onVerifyMfa(tempUserId, mfaToken, challengeToken);
        setIsLoading(false);
        if (!result.success) {
          setError(result.error || 'Invalid MFA code');
        }
      } else {
        setIsLoading(false);
        setError('MFA verification not supported in this context');
      }
    }
  };

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('NitechSpark#2026');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResetMessage(null);
    try {
      await api.resetPassword(resetEmail, resetPassword);
      setResetMessage('Password updated successfully! You can now log in.');
      setEmail(resetEmail);
      setPassword(resetPassword);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetMessage(null);
      }, 1500);
    } catch (err: any) {
      setResetMessage(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Super Admin', email: 'admin@nitechspark.in' },
    { label: 'NitechSpark HR', email: 'hr@nitechspark.in' },
    { label: 'NSK HR', email: 'hr@nskgroups.com' },
    { label: 'Apex Admin', email: 'orgadmin@apex.com' },
    { label: 'Auditor', email: 'auditor.internal@nitechspark.in' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-slate-950">
      {/* Premium Mesh Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="max-w-[460px] w-full relative z-10">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">

          {/* Header Section */}
          <div className="p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/8 via-indigo-500/5 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

            <div className="relative z-10 space-y-5">
              <div className="flex justify-center animate-in slide-in-from-top-4 duration-500">
                <SparkAuditIcon size={76} />
              </div>
              <div className="space-y-1">
                <h1 className="text-[28px] font-black text-white tracking-[0.12em] uppercase">
                  Spark<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Audit</span>
                </h1>
                <p className="text-blue-400/80 text-[10px] font-black uppercase tracking-[0.35em]">{COMPANY_TAGLINE}</p>
              </div>
            </div>
          </div>


          <div className="px-10 pb-12 space-y-6">
            {/* Quick Login Chips for Demo Ease */}
            <div className="space-y-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block text-center">Quick Demo Account Switch</span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {demoAccounts.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword('NitechSpark#2026');
                      setError(null);
                    }}
                    className={`text-[9px] font-black px-2.5 py-1 rounded-full border transition-all uppercase tracking-wider ${email.toLowerCase() === acc.email.toLowerCase() ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'}`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-center animate-in fade-in duration-1000 delay-300">
              <h2 className="text-lg font-bold text-white/90">{step === 1 ? 'Portal Access' : 'Two-Factor Authentication'}</h2>
              <p className="text-white/40 text-xs font-medium italic">
                {step === 1 ? 'Secure verification required for internal access' : 'Enter the 6-digit code from your authenticator app'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              {step === 1 ? (
                <>
                  <div className="space-y-2 group">
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] pl-1">Corporate Email</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@corporate.in"
                        className="w-full pl-14 pr-4 py-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white/[0.06] transition-all text-sm font-medium text-white outline-none placeholder:text-white/10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <div className="flex justify-between items-center pl-1">
                      <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Security Key</label>
                      <button
                        type="button"
                        onClick={() => { setResetEmail(email || 'hr@nitechspark.in'); setIsResetModalOpen(true); }}
                        className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors font-black uppercase tracking-widest underline"
                      >
                        Reset Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-14 pr-14 py-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white/[0.06] transition-all text-sm font-medium text-white outline-none placeholder:text-white/10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2 group animate-in slide-in-from-right-4 duration-500">
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] pl-1">6-Digit Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      type="text"
                      value={mfaToken}
                      onChange={(e) => setMfaToken(e.target.value)}
                      placeholder="000000"
                      className="w-full pl-14 pr-4 py-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white/[0.06] transition-all text-2xl tracking-widest font-medium text-center text-white outline-none placeholder:text-white/10"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <ShieldAlert className="text-red-500 shrink-0" size={18} />
                  <p className="text-[11px] font-black text-red-500 uppercase tracking-wider">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Validating...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} className="text-white/80" />
                    Enter Workspace
                  </>
                )}
              </button>
            </form>

            <div className="pt-8 border-t border-white/[0.05] animate-in fade-in duration-1000 delay-500">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Secure Node 2.5 Active</span>
                </div>
                <div className="mt-4">
                  <span className="text-[9px] text-slate-500 font-medium text-center uppercase tracking-widest block">&copy; 2026 All rights reserved by NITECHSPARK</span>
                </div>
                <p className="text-[9px] text-white/20 text-center leading-relaxed font-medium">
                  {COMPANY_NAME} &bull; Internal System &copy; {new Date().getFullYear()}<br />
                  All activities monitored under ISMS standards
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[32px] p-8 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Reset Security Key</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Instant password recovery for demo accounts</p>
              </div>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-500 hover:text-white bg-white/5 p-2 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Email</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="hr@nitechspark.in"
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Security Key</label>
                <input
                  type="text"
                  required
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium outline-none focus:border-blue-500"
                />
              </div>

              {resetMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center ${resetMessage.includes('successfully') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {resetMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/20"
              >
                {isLoading ? 'Resetting...' : 'Update & Log In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
