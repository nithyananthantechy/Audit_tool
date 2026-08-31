import React, { useEffect, useRef, useState } from 'react';
import { SparkAuditBrandLogo } from '../constants';
import {
  ShieldCheck,
  ArrowRight,
  BarChart3,
  Lock,
  Zap,
  CheckCircle2,
  FileText,
  Users,
  Globe,
  ChevronRight,
  Activity,
  Building2,
  Award,
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

/* ── Animated counter hook ── */
function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return count;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] font-sans text-white selection:bg-cyan-500/20 overflow-x-hidden">

      {/* ══ NAVIGATION ══ */}
      <nav className={`fixed top-0 left-0 w-full z-[100] px-6 md:px-12 flex items-center justify-between transition-all duration-500 ${
        scrolled
          ? 'h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl shadow-black/40'
          : 'h-20 bg-transparent'
      }`}>
        <SparkAuditBrandLogo size="sm" showSubtitle={false} />

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block mr-1" />
            System Online
          </div>
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95"
          >
            Portal Login <ChevronRight size={14} />
          </button>
        </div>
      </nav>

      {/* ══ HERO SECTION ══ */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 px-6 md:px-12 max-w-7xl mx-auto">

        {/* ambient orbs */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-blue-600/12 blur-[130px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-700/14 blur-[130px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-900/8 blur-[160px] rounded-full" />
          {/* grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">

          {/* ── Left copy ── */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            {/* badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <Award size={12} className="text-cyan-400" />
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em]">Enterprise Compliance Platform</span>
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-cyan-300/70 uppercase tracking-[0.2em]">v2.5</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
                <span className="text-white">NitechSpark</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Unified&nbsp;Audit
                </span>
                <br />
                <span className="text-white">& Compliance Hub</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                End-to-end GRC management — from evidence collection and auditor oversight to CAPA resolution and regulatory reporting, all in one secure platform.
              </p>
            </div>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onLoginClick}
                className="group relative overflow-hidden flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-base hover:from-blue-500 hover:to-indigo-500 transition-all shadow-2xl shadow-blue-600/25 hover:shadow-blue-500/40 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <ShieldCheck size={18} />
                Access Secure Portal
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="flex -space-x-2">
                  {['S','N','A','H'].map((l,i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-indigo-700 border-2 border-[#030712] flex items-center justify-center text-[10px] font-black text-white">{l}</div>
                  ))}
                </div>
                <span className="text-[11px] font-medium text-slate-500">Trusted by 4+ departments</span>
              </div>
            </div>

            {/* trust pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {['ISO 27001', 'SOC 2 Type II', 'DPDP Act 2023', 'CERT-In'].map(f => (
                <span key={f} className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-white/[0.04] border border-white/[0.07] rounded-full">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right feature grid ── */}
          <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-700 delay-200">
            <FeatureCard
              icon={<ShieldCheck className="text-emerald-400" size={22} />}
              title="Evidence Upload"
              desc="Seamlessly submit audit documentation by department with chain-of-custody tracking."
              accentColor="emerald"
            />
            <FeatureCard
              icon={<Zap className="text-sky-400" size={22} />}
              title="Manager Reviews"
              desc="Accelerated multi-level approval cycles with real-time status visibility."
              accentColor="sky"
            />
            <FeatureCard
              icon={<BarChart3 className="text-violet-400" size={22} />}
              title="Auditor Oversight"
              desc="Comprehensive visibility for internal & external auditors across all controls."
              accentColor="violet"
            />
            <FeatureCard
              icon={<Lock className="text-orange-400" size={22} />}
              title="CAPA Reporting"
              desc="Digital compliance health tracking and corrective action management."
              accentColor="orange"
            />
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ══ */}
      <section className="border-y border-white/[0.06] bg-white/[0.02] backdrop-blur-sm py-14">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatItem value={100} suffix="%" label="Encrypted Data" />
          <StatItem value={4} suffix="+" label="Active Departments" />
          <StatItem value={99} suffix=".9%" label="Uptime SLA" />
          <StatItem value={4} suffix="" label="Compliance Frameworks" live />
        </div>
      </section>

      {/* ══ MODULES ROW ══ */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-300 uppercase tracking-[0.25em]">
            <Activity size={10} className="text-cyan-400" /> Platform Modules
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Everything in one<br /><span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">unified workspace</span></h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <FileText size={20} />, title: 'Audit Manager', desc: 'Create, scope, and track end-to-end audit engagements with traceability.', color: 'blue' },
            { icon: <Users size={20} />, title: 'Team Administration', desc: 'Multi-tenant org hierarchy, role-based access control, MFA enforcement.', color: 'violet' },
            { icon: <Globe size={20} />, title: 'Framework Library', desc: 'CERT-In, DPDP Act 2023, ISO 27001, SOC 2 Type II built-in control libraries.', color: 'cyan' },
            { icon: <Activity size={20} />, title: 'Risk & Governance', desc: 'Risk register, scoring matrix, and control effectiveness dashboards.', color: 'emerald' },
            { icon: <Building2 size={20} />, title: 'Organization Hub', desc: 'Manage client tenants, license subscriptions, and billing from a single pane.', color: 'indigo' },
            { icon: <Award size={20} />, title: 'Report Generator', desc: 'One-click compliance reports with executive summaries and finding heatmaps.', color: 'orange' },
          ].map(m => <ModuleCard key={m.title} {...m} />)}
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-white/[0.06] py-12 px-6 md:px-12 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <SparkAuditBrandLogo size="sm" showSubtitle />
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex gap-5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              <button className="hover:text-blue-400 transition-colors">Privacy Policy</button>
              <button className="hover:text-blue-400 transition-colors">Terms of Access</button>
              <button className="hover:text-blue-400 transition-colors">Contact</button>
            </div>
            <p className="text-[10px] text-slate-700">
              &copy; {new Date().getFullYear()} NitechSpark Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ── Feature Card ── */
type AccentColor = 'emerald' | 'sky' | 'violet' | 'orange';
const accentMap: Record<AccentColor, { border: string; bg: string; glow: string }> = {
  emerald: { border: 'border-emerald-500/15', bg: 'from-emerald-500/10', glow: 'hover:shadow-emerald-500/10' },
  sky:     { border: 'border-sky-500/15',     bg: 'from-sky-500/10',     glow: 'hover:shadow-sky-500/10' },
  violet:  { border: 'border-violet-500/15',  bg: 'from-violet-500/10',  glow: 'hover:shadow-violet-500/10' },
  orange:  { border: 'border-orange-500/15',  bg: 'from-orange-500/10',  glow: 'hover:shadow-orange-500/10' },
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; accentColor: AccentColor }> = ({ icon, title, desc, accentColor }) => {
  const a = accentMap[accentColor];
  return (
    <div className={`p-7 rounded-[28px] border ${a.border} bg-gradient-to-b ${a.bg} to-transparent backdrop-blur-sm hover:shadow-xl ${a.glow} hover:-translate-y-1 transition-all duration-300 group`}>
      <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="text-sm font-black text-white mb-1.5 uppercase tracking-wide">{title}</h4>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
};

/* ── Module Card ── */
const colorMap: Record<string, { icon: string; border: string; bg: string }> = {
  blue:    { icon: 'text-blue-400',   border: 'border-blue-500/12',   bg: 'from-blue-600/8' },
  violet:  { icon: 'text-violet-400', border: 'border-violet-500/12', bg: 'from-violet-600/8' },
  cyan:    { icon: 'text-cyan-400',   border: 'border-cyan-500/12',   bg: 'from-cyan-600/8' },
  emerald: { icon: 'text-emerald-400',border: 'border-emerald-500/12',bg: 'from-emerald-600/8' },
  indigo:  { icon: 'text-indigo-400', border: 'border-indigo-500/12', bg: 'from-indigo-600/8' },
  orange:  { icon: 'text-orange-400', border: 'border-orange-500/12', bg: 'from-orange-600/8' },
};

const ModuleCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; color: string }> = ({ icon, title, desc, color }) => {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`p-6 rounded-2xl border ${c.border} bg-gradient-to-b ${c.bg} to-transparent hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group flex gap-4`}>
      <div className={`w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center flex-shrink-0 ${c.icon} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-black text-white mb-1 uppercase tracking-wide">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

/* ── Stat Item ── */
const StatItem: React.FC<{ value: number; suffix: string; label: string; live?: boolean }> = ({ value, suffix, label, live }) => {
  const count = useCounter(value, 1800);
  return (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl font-black text-white tabular-nums">{count}</span>
        <span className="text-xl font-black text-cyan-400">{suffix}</span>
        {live && (
          <span className="ml-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        )}
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{label}</p>
    </div>
  );
};

export default LandingPage;