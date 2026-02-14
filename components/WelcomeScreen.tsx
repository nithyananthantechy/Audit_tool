import React from 'react';
import { User } from '../types';
import { DESICREW_LOGO, COMPANY_NAME } from '../constants';
import { Loader2, ShieldCheck } from 'lucide-react';

interface WelcomeScreenProps {
  user: User;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user }) => {
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
            src={DESICREW_LOGO}
            alt={`${COMPANY_NAME} Logo`}
            className="h-16 w-auto object-contain filter brightness-0 invert opacity-90"
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
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-slate-400 text-sm font-medium italic">Configuring your secure workspace...</p>
        </div>
      </div>

      <div className="absolute bottom-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
        {COMPANY_NAME} • Authorized Session
      </div>
    </div>
  );
};

export default WelcomeScreen;
