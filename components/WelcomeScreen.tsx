import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { NITECHSPARK_LOGO, COMPANY_NAME } from '../constants';
import { Loader2, ShieldCheck, QrCode } from 'lucide-react';
import { api } from '../apiClient';

interface WelcomeScreenProps {
  user: User;
  onComplete: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, onComplete }) => {
  const [setupMode, setSetupMode] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user.mfaEnabled === 0) {
      setSetupMode(true);
      api.setupMfa()
        .then(res => {
          setQrCodeUrl(res.qrCodeUrl);
          setSecret(res.secret);
        })
        .catch(err => setError('Failed to generate MFA setup.'));
    } else {
      const t = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [user, onComplete]);

  const handleVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.verifyMfa(user.id, mfaToken);
      if (result.success) {
        onComplete();
      } else {
        setError(result.error || 'Invalid code');
        setLoading(false);
      }
    } catch (e: any) {
      setError(e.message || 'Verification failed');
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 text-white text-center bg-slate-950">
      {/* Premium Mesh Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 mb-12 animate-in fade-in zoom-in-95 duration-1000">
        <div className="inline-block p-2 animate-bounce">
          <img
            src={NITECHSPARK_LOGO}
            alt={`${COMPANY_NAME} Logo`}
            className="h-24 w-auto object-contain mix-blend-screen scale-110"
          />
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-forwards">
        <h1 className="text-4xl font-bold tracking-tight">Welcome, {user.name}</h1>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl text-blue-400 font-semibold">{user.role}</p>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-sm font-bold uppercase tracking-widest">{user.department} Department</span>
          </div>
        </div>

        <div className="pt-12 flex flex-col items-center gap-3">
          {!setupMode ? (
            <>
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-slate-400 text-sm font-medium italic">Configuring your secure workspace...</p>
            </>
          ) : (
            <div className="bg-white/[0.03] p-8 rounded-[32px] border border-white/[0.08] max-w-md w-full animate-in zoom-in-95 duration-500">
              <h2 className="text-xl font-bold text-white mb-2">Enable Two-Factor Authentication</h2>
              <p className="text-sm text-slate-400 mb-6">Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) to proceed.</p>
              
              {qrCodeUrl ? (
                <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-xl shadow-blue-500/10">
                  <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-6">
                  <Loader2 className="animate-spin text-slate-500" size={32} />
                </div>
              )}

              {secret && (
                <p className="text-[10px] text-slate-500 font-mono mb-6 bg-slate-900 p-2 rounded-lg break-all">
                  Secret: {secret}
                </p>
              )}

              <div className="space-y-4">
                <input
                  type="text"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-2xl tracking-widest text-center font-bold outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20 transition-all"
                />
                
                {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

                <button
                  onClick={handleVerify}
                  disabled={mfaToken.length < 6 || loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  Verify & Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
        {COMPANY_NAME} • Authorized Session
      </div>
    </div>
  );
};

export default WelcomeScreen;
