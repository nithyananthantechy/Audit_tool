import React, { useState } from 'react';
import { DESICREW_LOGO, COMPANY_NAME, COMPANY_TAGLINE, APP_NAME } from '../constants';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => boolean;
}

const LoginPage: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth delay
    setTimeout(() => {
      const success = onLogin(email, password);
      if (!success) {
        setIsLoading(false);
      }
    }, 1200);
  };

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
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
              <div className="animate-in slide-in-from-top-4 duration-500">
                <img
                  src={DESICREW_LOGO}
                  alt={`${COMPANY_NAME} Logo`}
                  className="h-12 w-auto object-contain block mx-auto filter brightness-0 invert opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x60?text=DesiCrew';
                  }}
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white tracking-widest uppercase">{APP_NAME}</h1>
                <p className="text-blue-400 text-[11px] font-black uppercase tracking-[0.4em]">{COMPANY_TAGLINE}</p>
              </div>
            </div>
          </div>

          <div className="px-10 pb-12 space-y-8">
            <div className="space-y-1 text-center animate-in fade-in duration-1000 delay-300">
              <h2 className="text-lg font-bold text-white/90">Portal Access</h2>
              <p className="text-white/40 text-xs font-medium italic">Secure verification required for internal access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="space-y-2 group">
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] pl-1">Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@desicrew.in"
                    className="w-full pl-14 pr-4 py-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white/[0.06] transition-all text-sm font-medium text-white outline-none placeholder:text-white/10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between items-center pl-1">
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Security Key</label>
                  <button type="button" className="text-[9px] text-blue-400/60 hover:text-blue-400 transition-colors font-black uppercase tracking-widest">Recovery?</button>
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
                <p className="text-[9px] text-white/20 text-center leading-relaxed font-medium">
                  {COMPANY_NAME} &bull; Internal System &copy; {new Date().getFullYear()}<br />
                  All activities monitored under ISMS standards
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
