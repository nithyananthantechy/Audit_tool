import React, { useEffect, useRef, useState } from 'react';
import { SparkAuditBrandLogo } from '../constants';
import {
  ShieldCheck,
  ArrowRight,
  BarChart3,
  Lock,
  Zap,
  FileText,
  Users,
  Globe,
  Activity,
  Building2,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

/* ── Animated counter hook ── */
function useCounter(target: number, duration = 1600) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else setCount(target);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [started, target, duration]);

  return { count, containerRef };
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */
const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{ background: 'var(--sa-bg)', fontFamily: "'Inter', sans-serif" }}
    >

      {/* ══ NAVIGATION ══ */}
      <header
        className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${
          scrolled
            ? 'sa-glass-strong border-b'
            : 'border-b border-transparent'
        }`}
        style={{ borderColor: scrolled ? 'var(--sa-border)' : 'transparent' }}
      >
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 h-[72px] flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center">
            <SparkAuditBrandLogo size="nav" />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* System status — desktop only */}
            <div className="hidden sm:flex sa-status-online">
              <span className="sa-pulse-dot" />
              System Online
            </div>

            {/* Portal Login CTA */}
            <button
              id="nav-portal-login"
              onClick={onLoginClick}
              aria-label="Access SparkAudit Portal"
              className="sa-btn-primary"
              style={{ height: 42, padding: '0 22px', fontSize: 13 }}
            >
              Portal Login
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section
        className="relative min-h-screen flex items-center sa-grid-bg overflow-hidden"
        style={{ paddingTop: 72 }}
      >
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div
            className="absolute rounded-full"
            style={{
              top: '-8%', left: '-6%',
              width: 600, height: 600,
              background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              bottom: '-8%', right: '-4%',
              width: 520, height: 520,
              background: 'radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              top: '40%', left: '50%',
              width: 700, height: 300,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(ellipse, rgba(6,182,212,0.05) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 w-full py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left copy */}
            <div className="lg:col-span-7 space-y-7 sa-anim-up">

              {/* Platform badge */}
              <div className="sa-section-tag w-fit">
                <Award size={10} className="text-blue-300" />
                Enterprise GRC &amp; Compliance Platform
                <span className="sa-pulse-dot" style={{ width: 5, height: 5 }} />
              </div>

              {/* Heading */}
              <div className="space-y-4">
                <h1
                  className="font-black leading-[1.08] tracking-tight"
                  style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)' }}
                >
                  <span style={{ color: 'var(--sa-text)' }}>SparkAudit</span>
                  <br />
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #06b6d4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Unified Audit
                  </span>
                  <br />
                  <span style={{ color: 'var(--sa-text)' }}>&amp; Compliance Hub</span>
                </h1>

                <p
                  className="max-w-[540px] leading-[1.75]"
                  style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)', color: 'var(--sa-text-muted)' }}
                >
                  End-to-end GRC management — from evidence collection and auditor
                  oversight to CAPA resolution and regulatory reporting, all in one
                  secure platform.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  id="hero-access-portal"
                  onClick={onLoginClick}
                  aria-label="Access SparkAudit Secure Portal"
                  className="sa-btn-primary"
                  style={{ height: 52, padding: '0 32px', fontSize: 15 }}
                >
                  <ShieldCheck size={18} />
                  Access Secure Portal
                  <ArrowRight size={16} />
                </button>

                {/* Social proof strip */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--sa-border)',
                  }}
                >
                  <div className="flex -space-x-2">
                    {['S', 'N', 'A', 'H'].map((letter, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center rounded-full text-white font-bold border-2"
                        style={{
                          width: 28, height: 28,
                          fontSize: 10,
                          background: `linear-gradient(135deg, #2563EB, #4f46e5)`,
                          borderColor: 'var(--sa-bg)',
                        }}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--sa-text-muted)', fontWeight: 600 }}>
                    Trusted by 4+ departments
                  </span>
                </div>
              </div>

              {/* Framework pills */}
              <div className="flex flex-wrap gap-2">
                {['ISO 27001', 'SOC 2 Type II', 'DPDP Act 2023', 'CERT-In'].map(fw => (
                  <span
                    key={fw}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--sa-text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      padding: '4px 12px',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid var(--sa-border)',
                      borderRadius: 6,
                    }}
                  >
                    {fw}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Feature cards */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4 sa-anim-up sa-delay-2">
              <FeatureCard
                icon={<ShieldCheck size={20} style={{ color: '#34d399' }} />}
                iconBg="rgba(16,185,129,0.10)"
                iconBorder="rgba(16,185,129,0.18)"
                title="Evidence Upload"
                desc="Seamlessly submit audit documentation by department with chain-of-custody tracking."
                accentBorder="rgba(16,185,129,0.12)"
              />
              <FeatureCard
                icon={<Zap size={20} style={{ color: '#38bdf8' }} />}
                iconBg="rgba(56,189,248,0.10)"
                iconBorder="rgba(56,189,248,0.18)"
                title="Manager Reviews"
                desc="Accelerated multi-level approval cycles with real-time status visibility."
                accentBorder="rgba(56,189,248,0.12)"
              />
              <FeatureCard
                icon={<BarChart3 size={20} style={{ color: '#a78bfa' }} />}
                iconBg="rgba(167,139,250,0.10)"
                iconBorder="rgba(167,139,250,0.18)"
                title="Auditor Oversight"
                desc="Comprehensive visibility for internal &amp; external auditors across all controls."
                accentBorder="rgba(167,139,250,0.12)"
              />
              <FeatureCard
                icon={<Lock size={20} style={{ color: '#fb923c' }} />}
                iconBg="rgba(251,146,60,0.10)"
                iconBorder="rgba(251,146,60,0.18)"
                title="CAPA Reporting"
                desc="Digital compliance health tracking and corrective action management."
                accentBorder="rgba(251,146,60,0.12)"
              />
            </div>

          </div>
        </div>
      </section>

      {/* ══ METRICS STRIP ══ */}
      <section
        style={{
          borderTop: '1px solid var(--sa-border)',
          borderBottom: '1px solid var(--sa-border)',
          background: 'var(--sa-surface)',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            <StatItem value={100} suffix="%" label="Encrypted Data" icon={<Lock size={16} />} />
            <StatItem value={4}   suffix="+"  label="Active Departments" icon={<Building2 size={16} />} />
            <StatItem value={99}  suffix=".9%" label="Uptime SLA" icon={<TrendingUp size={16} />} live />
            <StatItem value={4}   suffix=""   label="Compliance Frameworks" icon={<Award size={16} />} />
          </div>
        </div>
      </section>

      {/* ══ PLATFORM MODULES ══ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">

          {/* Section header */}
          <div className="text-center mb-14 space-y-4">
            <div className="sa-section-tag mx-auto w-fit">
              <Activity size={10} />
              Platform Modules
            </div>
            <h2
              className="font-black tracking-tight"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', lineHeight: 1.12 }}
            >
              Everything in one{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                unified workspace
              </span>
            </h2>
            <p
              className="max-w-xl mx-auto"
              style={{ fontSize: 15, color: 'var(--sa-text-muted)', lineHeight: 1.7 }}
            >
              Six purpose-built modules covering every layer of your GRC programme,
              from risk registers to one-click compliance reports.
            </p>
          </div>

          {/* Module grid: 3 cols desktop, 2 tablet, 1 mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                icon: <FileText size={18} />,
                title: 'Audit Manager',
                desc: 'Create, scope, and track end-to-end audit engagements with full traceability.',
                accent: '#2563EB',
              },
              {
                icon: <Users size={18} />,
                title: 'Team Administration',
                desc: 'Multi-tenant org hierarchy, role-based access control, and MFA enforcement.',
                accent: '#7c3aed',
              },
              {
                icon: <Globe size={18} />,
                title: 'Framework Library',
                desc: 'CERT-In, DPDP Act 2023, ISO 27001, SOC 2 Type II built-in control libraries.',
                accent: '#0891b2',
              },
              {
                icon: <Activity size={18} />,
                title: 'Risk & Governance',
                desc: 'Risk register, scoring matrix, and control effectiveness dashboards.',
                accent: '#059669',
              },
              {
                icon: <Building2 size={18} />,
                title: 'Organization Hub',
                desc: 'Manage client tenants, license subscriptions, and billing from a single pane.',
                accent: '#4f46e5',
              },
              {
                icon: <Award size={18} />,
                title: 'Report Generator',
                desc: 'One-click compliance reports with executive summaries and finding heatmaps.',
                accent: '#d97706',
              },
            ].map((m, i) => (
              <ModuleCard key={m.title} {...m} delay={i * 60} />
            ))}
          </div>

        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer
        style={{
          borderTop: '1px solid var(--sa-border)',
          background: 'var(--sa-surface)',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Footer logo — smaller */}
            <SparkAuditBrandLogo size="footer" />

            {/* Links + copyright */}
            <div className="flex flex-col items-center md:items-end gap-3">
              <nav className="flex gap-6" aria-label="Footer navigation">
                {['Privacy Policy', 'Terms of Access', 'Contact'].map(link => (
                  <button
                    key={link}
                    className="transition-colors duration-150"
                    style={{ fontSize: 11, fontWeight: 600, color: 'var(--sa-text-dim)', letterSpacing: '0.05em', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#60a5fa')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--sa-text-dim)')}
                  >
                    {link}
                  </button>
                ))}
              </nav>
              <p style={{ fontSize: 11, color: 'var(--sa-text-dim)' }}>
                &copy; {new Date().getFullYear()} NitechSpark Technologies. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

/* ═══════════════════════════════════════════════
   FEATURE CARD
   ═══════════════════════════════════════════════ */
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  title: string;
  desc: string;
  accentBorder: string;
}> = ({ icon, iconBg, iconBorder, title, desc, accentBorder }) => (
  <div
    className="sa-card group flex flex-col gap-4 p-5 cursor-default"
    style={{ border: `1px solid ${accentBorder}`, background: 'var(--sa-card)' }}
  >
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
      style={{
        width: 40, height: 40,
        background: iconBg,
        border: `1px solid ${iconBorder}`,
      }}
    >
      {icon}
    </div>
    <div>
      <h4
        className="font-bold mb-1.5"
        style={{ fontSize: 13, color: 'var(--sa-text)', letterSpacing: '0.01em' }}
      >
        {title}
      </h4>
      <p style={{ fontSize: 12, color: 'var(--sa-text-muted)', lineHeight: 1.65 }}>
        {desc}
      </p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════
   MODULE CARD
   ═══════════════════════════════════════════════ */
const ModuleCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  delay?: number;
}> = ({ icon, title, desc, accent, delay = 0 }) => (
  <div
    className="group flex gap-4 p-5 rounded-2xl cursor-default transition-all duration-200"
    style={{
      background: 'var(--sa-card)',
      border: '1px solid var(--sa-border)',
      animationDelay: `${delay}ms`,
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLDivElement;
      el.style.transform = 'translateY(-3px)';
      el.style.borderColor = `${accent}25`;
      el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.25)`;
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLDivElement;
      el.style.transform = '';
      el.style.borderColor = 'var(--sa-border)';
      el.style.boxShadow = '';
    }}
  >
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform duration-200"
      style={{
        width: 38, height: 38,
        background: `${accent}15`,
        border: `1px solid ${accent}25`,
        color: accent,
      }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <h4
        className="font-bold mb-1"
        style={{ fontSize: 13, color: 'var(--sa-text)', letterSpacing: '0.01em' }}
      >
        {title}
      </h4>
      <p style={{ fontSize: 12, color: 'var(--sa-text-muted)', lineHeight: 1.65 }}>
        {desc}
      </p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════
   STAT ITEM
   ═══════════════════════════════════════════════ */
const StatItem: React.FC<{
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
  live?: boolean;
}> = ({ value, suffix, label, icon, live }) => {
  const { count, containerRef } = useCounter(value, 1600);
  return (
    <div ref={containerRef} className="text-center flex flex-col items-center gap-3">
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          width: 44, height: 44,
          background: 'rgba(37,99,235,0.08)',
          border: '1px solid rgba(37,99,235,0.15)',
          color: '#60a5fa',
        }}
      >
        {icon}
      </div>
      <div>
        <div className="flex items-baseline justify-center gap-0.5">
          <span className="sa-stat-number">{count}</span>
          <span className="sa-stat-suffix" style={{ fontSize: '1.2rem', fontWeight: 900 }}>
            {suffix}
          </span>
          {live && (
            <span
              className="ml-2 rounded-full"
              style={{
                width: 7, height: 7,
                background: '#10b981',
                display: 'inline-block',
                animation: 'sa-pulse 2s ease infinite',
              }}
            />
          )}
        </div>
        <p className="sa-stat-label">{label}</p>
      </div>
    </div>
  );
};

export default LandingPage;