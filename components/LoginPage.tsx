import React, { useState } from 'react';
import { COMPANY_NAME, SparkAuditIcon } from '../constants';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, ShieldAlert, X, ChevronRight } from 'lucide-react';
import { api } from '../apiClient';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; mfaRequired?: boolean; userId?: string; challengeToken?: string }>;
  onVerifyMfa: (userId: string, token: string, challengeToken?: string) => Promise<{ success: boolean; error?: string }>;
}

/* ─── Demo accounts (no passwords exposed) ─── */
const demoAccounts = [
  { label: 'Super Admin',    email: 'admin@nitechspark.in',         role: 'System Administrator' },
  { label: 'NitechSpark HR', email: 'hr@nitechspark.in',            role: 'HR Department' },
  { label: 'NSK HR',         email: 'hr@nskgroups.com',             role: 'External Org HR' },
  { label: 'Apex Admin',     email: 'orgadmin@apex.com',            role: 'Org Administrator' },
  { label: 'Auditor',        email: 'auditor.internal@nitechspark.in', role: 'Internal Auditor' },
];

/* ─── Input Field ─── */
const FormField: React.FC<{
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ id, label, icon, children }) => (
  <div className="space-y-2">
    <label
      htmlFor={id}
      style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--sa-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
      }}
    >
      {label}
    </label>
    <div className="relative flex items-center">
      <span
        className="absolute left-4 pointer-events-none"
        style={{ color: 'var(--sa-text-dim)', display: 'flex' }}
        aria-hidden
      >
        {icon}
      </span>
      {children}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════ */
const LoginPage: React.FC<LoginProps> = ({ onLogin, onVerifyMfa }) => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [step, setStep]                 = useState<1 | 2>(1);
  const [mfaToken, setMfaToken]         = useState('');
  const [tempUserId, setTempUserId]     = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | undefined>(undefined);
  const [error, setError]               = useState<string | null>(null);

  /* ── Password reset ── */
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail]             = useState('');
  const [resetPassword, setResetPassword]       = useState('NitechSpark#2026');
  const [resetMessage, setResetMessage]         = useState<string | null>(null);

  /* ── Submit handlers ── */
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
        if (!result.success) setError(result.error || 'Invalid MFA code');
      } else {
        setIsLoading(false);
        setError('MFA verification not supported in this context');
      }
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResetMessage(null);
    try {
      await api.resetPassword(resetEmail, resetPassword);
      setResetMessage('Password updated successfully! You can now log in.');
      setEmail(resetEmail);
      setPassword(resetPassword);
      setTimeout(() => { setIsResetModalOpen(false); setResetMessage(null); }, 1500);
    } catch (err: any) {
      setResetMessage(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex"
      style={{ background: 'var(--sa-bg)', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Subtle security grid background ── */}
      <div
        className="absolute inset-0 pointer-events-none sa-grid-bg"
        aria-hidden
        style={{ opacity: 0.6 }}
      />

      {/* ── Ambient orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{
          position: 'absolute', top: '-8%', left: '-8%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-8%', right: '-8%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        {/* Faint horizontal accent line */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.08) 40%, rgba(79,70,229,0.08) 60%, transparent 100%)',
        }} />
      </div>

      {/* ══ TWO-COLUMN LAYOUT ══ */}
      <div className="relative z-10 flex w-full min-h-screen">

        {/* LEFT PANEL — branding (desktop only) */}
        <aside
          className="hidden lg:flex flex-col justify-between p-12 xl:p-16"
          style={{
            width: '45%',
            borderRight: '1px solid var(--sa-border)',
            background: 'rgba(11,21,48,0.35)',
          }}
        >
          {/* Logo */}
          <div>
            <SparkAuditIcon />
            <div className="mt-8 space-y-3">
              <h2
                className="font-black leading-tight"
                style={{ fontSize: 'clamp(1.5rem, 2vw, 2rem)', color: 'var(--sa-text)' }}
              >
                Enterprise GRC &amp;<br />
                Compliance Platform
              </h2>
              <p style={{ fontSize: 14, color: 'var(--sa-text-muted)', lineHeight: 1.7, maxWidth: 360 }}>
                Secure access to your end-to-end audit management, evidence tracking,
                CAPA workflows, and regulatory reporting — all in one unified workspace.
              </p>
            </div>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              { icon: '🔒', label: 'End-to-end encrypted data' },
              { icon: '🛡️', label: 'Multi-tenant tenant isolation' },
              { icon: '✅', label: 'ISO 27001 · SOC 2 · DPDP Act 2023' },
              { icon: '📊', label: 'Real-time audit dashboards' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--sa-text-muted)', fontWeight: 500 }}>
                  {f.label}
                </span>
              </div>
            ))}

            {/* System status */}
            <div className="mt-6 sa-status-online w-fit">
              <span className="sa-pulse-dot" />
              All Systems Operational
            </div>

            <p style={{ fontSize: 11, color: 'var(--sa-text-dim)', marginTop: 16 }}>
              &copy; {new Date().getFullYear()} {COMPANY_NAME} · All activities monitored under ISMS standards
            </p>
          </div>
        </aside>

        {/* RIGHT PANEL — auth card */}
        <main
          className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8"
          id="auth-main"
        >
          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden mb-8">
            <SparkAuditIcon />
          </div>

          {/* Auth card */}
          <div
            className="w-full sa-anim-card"
            style={{
              maxWidth: 460,
              background: 'var(--sa-surface)',
              border: '1px solid var(--sa-border-md)',
              borderRadius: 20,
              padding: 'clamp(24px, 4vw, 40px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
            }}
          >

            {/* Card header */}
            <div className="space-y-1 mb-6">
              <h1
                className="font-bold"
                style={{ fontSize: 22, color: 'var(--sa-text)', letterSpacing: '-0.01em' }}
              >
                {step === 1 ? 'Portal Access' : 'Two-Factor Verification'}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--sa-text-muted)' }}>
                {step === 1
                  ? 'Secure access to your compliance workspace.'
                  : 'Enter the 6-digit code from your authenticator app.'}
              </p>
            </div>

            {/* ── DEMO ACCESS SWITCHER ── */}
            {step === 1 && (
              <section
                aria-label="Demo access switcher"
                style={{
                  marginBottom: 20,
                  padding: '14px 16px',
                  background: 'rgba(37,99,235,0.04)',
                  border: '1px solid rgba(37,99,235,0.12)',
                  borderRadius: 12,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'var(--sa-text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    marginBottom: 10,
                  }}
                >
                  Demo Access
                </p>
                <div className="flex flex-wrap gap-2">
                  {demoAccounts.map(acc => {
                    const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        aria-label={`Select ${acc.label} demo account`}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setEmail(acc.email);
                          setPassword('NitechSpark#2026');
                          setError(null);
                        }}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          letterSpacing: '0.02em',
                          ...(isSelected
                            ? {
                                background: 'var(--sa-primary)',
                                color: '#fff',
                                borderColor: 'var(--sa-primary)',
                                boxShadow: '0 2px 12px rgba(37,99,235,0.35)',
                              }
                            : {
                                background: 'rgba(255,255,255,0.03)',
                                color: 'var(--sa-text-muted)',
                                borderColor: 'var(--sa-border-md)',
                              }),
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(37,99,235,0.4)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--sa-text)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sa-border-md)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--sa-text-muted)';
                          }
                        }}
                      >
                        {acc.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── AUTH FORM ── */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {step === 1 ? (
                <>
                  {/* Email */}
                  <FormField id="login-email" label="Corporate Email" icon={<Mail size={17} />}>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="user@corporate.in"
                      autoComplete="email"
                      required
                      className="sa-input"
                      style={{ paddingLeft: 48 }}
                      onFocus={e => (e.currentTarget.parentElement!.querySelector('span')! as HTMLElement).style.color = 'var(--sa-primary)'}
                      onBlur={e => (e.currentTarget.parentElement!.querySelector('span')! as HTMLElement).style.color = 'var(--sa-text-dim)'}
                    />
                  </FormField>

                  {/* Password */}
                  <FormField id="login-password" label="Security Key" icon={<Lock size={17} />}>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      required
                      className="sa-input"
                      style={{ paddingLeft: 48, paddingRight: 52 }}
                      onFocus={e => (e.currentTarget.parentElement!.querySelector('span')! as HTMLElement).style.color = 'var(--sa-primary)'}
                      onBlur={e => (e.currentTarget.parentElement!.querySelector('span')! as HTMLElement).style.color = 'var(--sa-text-dim)'}
                    />
                    {/* Show/hide password */}
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 transition-colors duration-150"
                      style={{ color: 'var(--sa-text-dim)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--sa-text)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--sa-text-dim)')}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </FormField>

                  {/* Forgot password */}
                  <div className="flex justify-end" style={{ marginTop: -6 }}>
                    <button
                      type="button"
                      onClick={() => { setResetEmail(email || 'hr@nitechspark.in'); setIsResetModalOpen(true); }}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--sa-primary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </>
              ) : (
                /* MFA step */
                <FormField id="login-mfa" label="6-Digit Authenticator Code" icon={<ShieldCheck size={17} />}>
                  <input
                    id="login-mfa"
                    type="text"
                    inputMode="numeric"
                    value={mfaToken}
                    onChange={e => setMfaToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="000 000"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    className="sa-input"
                    style={{
                      paddingLeft: 48,
                      textAlign: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: '0.3em',
                    }}
                  />
                </FormField>
              )}

              {/* Error state */}
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.20)',
                  }}
                >
                  <ShieldAlert size={17} style={{ color: '#f87171', flexShrink: 0 }} />
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#f87171' }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="sa-btn-primary w-full"
                style={{ height: 52, fontSize: 15, marginTop: 4 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Authenticating…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    {step === 1 ? 'Access Portal' : 'Verify Code'}
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Card footer */}
            <div
              className="mt-6 pt-5 text-center"
              style={{ borderTop: '1px solid var(--sa-border)' }}
            >
              <div
                className="inline-flex items-center gap-2 mb-3 sa-status-online"
                style={{ fontSize: 10 }}
              >
                <span className="sa-pulse-dot" />
                Secure Node 2.5 Active
              </div>
              <p style={{ fontSize: 10, color: 'var(--sa-text-dim)' }}>
                All activities are monitored and logged under ISMS standards.
              </p>
            </div>

          </div>

          {/* Mobile footer */}
          <p
            className="lg:hidden mt-6"
            style={{ fontSize: 11, color: 'var(--sa-text-dim)', textAlign: 'center' }}
          >
            &copy; {new Date().getFullYear()} {COMPANY_NAME} · All rights reserved.
          </p>
        </main>
      </div>

      {/* ══ RESET PASSWORD MODAL ══ */}
      {isResetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(5,9,26,0.85)', backdropFilter: 'blur(16px)' }}
        >
          <div
            className="w-full sa-anim-card"
            style={{
              maxWidth: 440,
              background: 'var(--sa-surface)',
              border: '1px solid var(--sa-border-md)',
              borderRadius: 18,
              padding: 32,
              boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between pb-4 mb-5"
              style={{ borderBottom: '1px solid var(--sa-border)' }}
            >
              <div>
                <h3
                  id="reset-modal-title"
                  className="font-bold"
                  style={{ fontSize: 17, color: 'var(--sa-text)' }}
                >
                  Reset Security Key
                </h3>
                <p style={{ fontSize: 12, color: 'var(--sa-text-muted)', marginTop: 2 }}>
                  Instant password recovery for demo accounts
                </p>
              </div>
              <button
                aria-label="Close modal"
                onClick={() => setIsResetModalOpen(false)}
                className="rounded-lg transition-colors"
                style={{
                  padding: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--sa-border)',
                  color: 'var(--sa-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--sa-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--sa-text-muted)')}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="reset-email"
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block' }}
                >
                  Account Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="hr@nitechspark.in"
                  className="sa-input"
                  style={{ paddingLeft: 16 }}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reset-password"
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block' }}
                >
                  New Security Key
                </label>
                <input
                  id="reset-password"
                  type="text"
                  required
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  className="sa-input"
                  style={{ paddingLeft: 16 }}
                />
              </div>

              {resetMessage && (
                <div
                  className="p-3 rounded-xl text-center"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    ...(resetMessage.includes('successfully')
                      ? { background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.20)' }
                      : { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }),
                  }}
                >
                  {resetMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="sa-btn-primary w-full"
                style={{ height: 48, fontSize: 14 }}
              >
                {isLoading ? 'Updating…' : 'Update & Log In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
