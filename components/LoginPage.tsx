import React, { useState } from 'react';
import { COMPANY_NAME, COMPANY_TAGLINE, SparkAuditIcon } from '../constants';
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-slate-950">
      {/* Background Mesh Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-blue-600/15 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/15 blur-[130px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="max-w-[480px] w-full relative z-10 my-auto">
        {/* Enterprise Glassmorphism Card */}
        <div className="backdrop-blur-2xl bg-slate-900/60 border border-white/[0.09] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-500">

          {/* 1. Logo & Tagline Header */}
          <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2">
            <SparkAuditIcon width={240} />
            <p className="text-[10px] font-black text-cyan-400/90 uppercase tracking-[0.22em] max-w-[360px] leading-tight">
              {COMPANY_TAGLINE}
            </p>
          </div>

          {/* 2. Quick Demo Account Switch */}
          <div className="space-y-2 pt-1 border-t border-white/[0.06]">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center">
              Quick Demo Account Switch
            </span>
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
                  className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-all uppercase tracking-wider ${
                    email.toLowerCase() === acc.email.toLowerCase()
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/30 scale-[1.02]'
                      : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Portal Access Heading */}
          <div className="space-y-1 text-center pt-1">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {step === 1 ? 'Portal Access' : 'Two-Factor Authentication'}
            </h2>
            <p className="text-slate-400 text-xs font-medium">
              {step === 1 ? 'Secure verification required for internal access' : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          {/* 4. Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                {/* Email Input */}
                <div className="space-y-1.5 group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@corporate.in"
                      className="w-full h-[54px] pl-12 pr-4 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white/[0.06] transition-all text-sm font-medium text-white outline-none placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5 group">
                  <div className="flex justify-between items-center pl-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Security Key
                    </label>
                    <button
                      type="button"
                      onClick={() => { setResetEmail(email || 'hr@nitechspark.in'); setIsResetModalOpen(true); }}
                      className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors font-black uppercase tracking-widest underline"
                    >
                      Reset Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-[54px] pl-12 pr-12 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white/[0.06] transition-all text-sm font-medium text-white outline-none placeholder:text-slate-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5 group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">
                  6-Digit Code
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <input
                    type="text"
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value)}
                    placeholder="000000"
                    className="w-full h-[54px] pl-12 pr-4 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white/[0.06] transition-all text-2xl tracking-widest font-medium text-center text-white outline-none placeholder:text-slate-600"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex items-center gap-3">
                <ShieldAlert className="text-red-400 shrink-0" size={18} />
                <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[54px] relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-70"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
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

          {/* 5. Secure Node Status Footer */}
          <div className="pt-4 border-t border-white/[0.06] text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/15">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Secure Node 2.5 Active</span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} {COMPANY_NAME} &bull; All activities monitored under ISMS standards
            </p>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Reset Security Key</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Instant password recovery for demo accounts</p>
              </div>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Email</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="hr@nitechspark.in"
                  className="w-full h-[48px] bg-slate-950 border border-white/10 rounded-xl px-4 text-sm text-white font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Security Key</label>
                <input
                  type="text"
                  required
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  className="w-full h-[48px] bg-slate-950 border border-white/10 rounded-2xl px-4 text-sm text-white font-medium outline-none focus:border-blue-500"
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
                className="w-full h-[48px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
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
