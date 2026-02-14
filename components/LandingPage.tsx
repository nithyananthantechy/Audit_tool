import React from 'react';
import { DESICREW_LOGO, COMPANY_NAME, COMPANY_TAGLINE, APP_NAME } from '../constants';
import {
  ShieldCheck,
  Search,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Lock,
  Zap,
  CheckCircle2,
  Globe,
  Menu,
  Users,
  FileText
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full h-20 bg-slate-950/40 backdrop-blur-md border-b border-white/5 z-[100] px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src={DESICREW_LOGO}
              alt={`${COMPANY_NAME} Logo`}
              className="h-10 w-auto object-contain filter brightness-0 invert opacity-90"
              style={{ maxHeight: '44px' }}
            />
          </div>
          <div className="hidden lg:block h-6 w-px bg-white/10 mx-2"></div>
          <div className="hidden lg:block">
            <p className="text-sm font-black text-white uppercase tracking-[0.2em]">{APP_NAME}</p>
          </div>
        </div>


        <div className="flex items-center gap-4">
          <button
            onClick={onLoginClick}
            className="hidden sm:block px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
          >
            Portal Login
          </button>
          <button className="md:hidden p-2 text-white">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Premium Mesh Gradient Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Enterprise Compliance</span>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">v2.5 Release</span>
            </div>

            <h2 className="text-5xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              DesiCrew <span className="text-blue-500">Internal</span> <br /> Audit & Compliance Hub
            </h2>

            <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
              Ensuring organizational excellence through streamlined audit workflows and centralized compliance records.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={onLoginClick}
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 text-lg"
              >
                Access Secure Portal <ArrowRight size={20} />
              </button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="h-px w-16 bg-blue-500/50"></div>
              <p className="text-xs font-medium text-slate-500">
                <span className="text-white font-bold">Secure</span> Enterprise Access
              </p>
            </div>
          </div>

          {/* Feature Cards Grid (Quantarra Style) */}
          <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-1000 delay-200">
            <FeatureCard
              icon={<ShieldCheck className="text-emerald-500" />}
              title="Evidence Upload"
              desc="Seamlessly submit audit documentation by department."
              color="bg-emerald-500/5 border-emerald-500/10"
            />
            <FeatureCard
              icon={<Zap className="text-blue-500" />}
              title="Manager Reviews"
              desc="Accelerated approval cycles for department leads."
              color="bg-blue-500/5 border-blue-500/10"
            />
            <FeatureCard
              icon={<BarChart3 className="text-purple-500" />}
              title="Auditor Oversight"
              desc="Comprehensive visibility for internal and external auditors."
              color="bg-purple-500/5 border-purple-500/10"
            />
            <FeatureCard
              icon={<Lock className="text-orange-500" />}
              title="DMAX Reporting"
              desc="Digital Compliance Health Tracking across the organization."
              color="bg-orange-500/5 border-orange-500/10"
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-slate-900/30 py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 flex flex-wrap items-center justify-center md:justify-start gap-10">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-white">100%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Encrypted Data</span>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-white">04</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Departments</span>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-2xl font-black text-white">Live</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audit Tracking</span>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl shadow-sm border border-white/10 backdrop-blur-sm flex items-center gap-6">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">99.9% Uptime SLA</p>
              <p className="text-xs text-slate-400">Continuous monitoring & audit trails</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 md:px-12 border-t border-white/5 text-center bg-slate-950">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={DESICREW_LOGO} alt="DesiCrew" className="h-6 w-auto opacity-50 filter brightness-0 invert" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{APP_NAME}</span>
          </div>
          <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} DesiCrew Solutions Private Limited. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <button className="hover:text-blue-400 transition-colors">Privacy Policy</button>
            <button className="hover:text-blue-400 transition-colors">Terms of Access</button>
            <button className="hover:text-blue-400 transition-colors">Contact Compliance</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string, color: string }> = ({ icon, title, desc, color }) => (
  <div className={`p-8 rounded-[32px] border ${color} hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:-translate-y-1 transition-all group backdrop-blur-xl`}>
    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
    <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;