import React, { useState, useEffect } from 'react';
import { User, Role, Department, Control, RiskItem, Finding, AuditSchedule, ActivityType } from '../types';
import {
  Shield, AlertTriangle, ListChecks, CheckCircle2, Clock, Plus, Search,
  Filter, Brain, FileText, Layers, TrendingUp, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { api } from '../apiClient';

interface GovernanceHubProps {
  user: User;
  logActivity: (user: User, action: ActivityType, description: string) => void;
}

const GovernanceHub: React.FC<GovernanceHubProps> = ({ user, logActivity }) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'risks' | 'findings' | 'schedules'>('controls');
  const [controls, setControls] = useState<Control[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('All');

  // Control Form State
  const [isAddingControl, setIsAddingControl] = useState(false);
  const [ctrlForm, setCtrlForm] = useState<Partial<Control>>({
    controlId: '',
    framework: 'ISO 27001',
    title: '',
    objective: '',
    requirement: '',
    risk: '',
    department: 'IT',
    frequency: 'Continuous',
    evidenceType: 'Document',
    scoringMethod: 'Maturity Score',
    status: 'Active'
  });

  // Risk Form State
  const [isAddingRisk, setIsAddingRisk] = useState(false);
  const [riskForm, setRiskForm] = useState<Partial<RiskItem>>({
    riskId: '',
    title: '',
    description: '',
    department: 'IT',
    asset: '',
    threat: '',
    vulnerability: '',
    likelihood: 3,
    impact: 3,
    existingControls: '',
    status: 'Open'
  });

  // Finding Form State
  const [isAddingFinding, setIsAddingFinding] = useState(false);
  const [findingForm, setFindingForm] = useState<Partial<Finding>>({
    findingId: '',
    title: '',
    description: '',
    severity: 'High',
    rootCause: '',
    recommendation: '',
    status: 'Open'
  });

  const loadGovernanceData = async () => {
    setLoading(true);
    try {
      const data = await api.getData();
      if (data.controls) setControls(data.controls);
      if (data.risks) setRisks(data.risks);
      if (data.findings) setFindings(data.findings);
    } catch (err) {
      console.error('Failed to load governance dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGovernanceData();
  }, []);

  const handleSaveControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctrlForm.controlId || !ctrlForm.title) {
      alert('Control ID and Title are required.');
      return;
    }
    try {
      await api.addControl(ctrlForm);
      logActivity(user, ActivityType.SYSTEM, `Added compliance control ${ctrlForm.controlId}: ${ctrlForm.title}`);
      setIsAddingControl(false);
      loadGovernanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to save control.');
    }
  };

  const handleSaveRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskForm.title) {
      alert('Risk Title is required.');
      return;
    }
    try {
      await api.addRisk(riskForm);
      logActivity(user, ActivityType.SYSTEM, `Logged risk register item: ${riskForm.title}`);
      setIsAddingRisk(false);
      loadGovernanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to save risk.');
    }
  };

  const handleSaveFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findingForm.title) {
      alert('Finding Title is required.');
      return;
    }
    try {
      await api.addFinding(findingForm);
      logActivity(user, ActivityType.SYSTEM, `Registered audit finding: ${findingForm.title}`);
      setIsAddingFinding(false);
      loadGovernanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to save audit finding.');
    }
  };

  const frameworks = ['All', 'ISO 27001', 'SOC 2', 'NIST CSF', 'CIS Controls', 'GDPR', 'Internal Policies'];

  const filteredControls = controls.filter(c =>
    (selectedFramework === 'All' || c.framework === selectedFramework) &&
    ((c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.controlId || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
              <Shield className="text-blue-400" size={24} />
            </div>
            Governance, Risk & <span className="text-blue-500">Compliance</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">
            Integrated Framework Cross-Mapping, Risk Matrix & Finding Lifecycle
          </p>
        </div>

        <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'controls' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Control Library ({controls.length})
          </button>
          <button
            onClick={() => setActiveTab('risks')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'risks' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Risk Register ({risks.length})
          </button>
          <button
            onClick={() => setActiveTab('findings')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'findings' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Findings ({findings.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CONTROL LIBRARY */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-2xl p-6 rounded-3xl border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter controls by ID or objective..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-slate-600"
                />
              </div>

              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-white outline-none"
              >
                {frameworks.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {user.role === Role.SUPER_ADMIN && (
              <button
                onClick={() => setIsAddingControl(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Plus size={16} /> Define Control
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredControls.map((ctrl) => (
              <div key={ctrl.id} className="bg-white/[0.03] backdrop-blur-2xl p-6 rounded-3xl border border-white/[0.08] hover:border-blue-500/30 transition-all group relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider">
                      {ctrl.framework}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-bold">{ctrl.controlId}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {ctrl.status}
                  </span>
                </div>
                <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors mb-2">{ctrl.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{ctrl.objective || ctrl.requirement}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-4 border-t border-white/5">
                  <span>Frequency: {ctrl.frequency}</span>
                  <span>Dept: {ctrl.department}</span>
                  <span>Reviewer: {ctrl.reviewer}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredControls.length === 0 && (
            <div className="text-center py-16 bg-white/[0.01] rounded-3xl border border-white/5 text-slate-500 text-xs uppercase font-black tracking-widest">
              No controls found matching criteria
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RISK REGISTER */}
      {activeTab === 'risks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/[0.03] p-6 rounded-3xl border border-white/[0.08]">
            <div>
              <h2 className="text-lg font-black text-white">Enterprise Risk Register</h2>
              <p className="text-xs text-slate-400 mt-1">Impact & Likelihood Quantification Matrix</p>
            </div>
            <button
              onClick={() => setIsAddingRisk(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Plus size={16} /> Log Risk
            </button>
          </div>

          <div className="bg-slate-900/60 rounded-3xl border border-white/10 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-white/10">
                  <th className="px-6 py-4">Risk ID</th>
                  <th className="px-6 py-4">Title & Vulnerability</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Inherent Severity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {risks.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400 font-bold">{r.riskId}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-white text-sm">{r.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{r.description || r.threat}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-bold uppercase">{r.department}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        r.inherentRisk === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        r.inherentRisk === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {r.inherentRisk || 'Medium'} ({r.likelihood || 3}x{r.impact || 3})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded bg-white/5 text-slate-300 font-bold uppercase text-[9px]">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{r.owner}</td>
                  </tr>
                ))}
                {risks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                      No active risk entries registered
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FINDINGS MANAGEMENT */}
      {activeTab === 'findings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/[0.03] p-6 rounded-3xl border border-white/[0.08]">
            <div>
              <h2 className="text-lg font-black text-white">Audit Findings & Non-Conformances</h2>
              <p className="text-xs text-slate-400 mt-1">Lifecycle Tracking & Corrective Action Linkage</p>
            </div>
            <button
              onClick={() => setIsAddingFinding(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Plus size={16} /> Record Finding
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {findings.map((f) => (
              <div key={f.id} className="bg-white/[0.03] backdrop-blur-2xl p-6 rounded-3xl border border-white/[0.08] hover:border-amber-500/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                    f.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    f.severity === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {f.severity} Severity
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{f.findingId}</span>
                </div>
                <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{f.description || f.impact}</p>

                {f.recommendation && (
                  <div className="bg-slate-950/60 p-3 rounded-xl text-xs text-slate-300 mb-4 border border-white/5">
                    <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest block mb-1">Recommended Remediation</span>
                    {f.recommendation}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-3 border-t border-white/5">
                  <span>Status: <span className="text-white">{f.status}</span></span>
                  <span>Owner: {f.owner}</span>
                  <span>Due: {f.dueDate}</span>
                </div>
              </div>
            ))}

            {findings.length === 0 && (
              <div className="col-span-2 text-center py-16 bg-white/[0.01] rounded-3xl border border-white/5 text-slate-500 text-xs uppercase font-black tracking-widest">
                No open findings or audit non-conformances registered
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD CONTROL MODAL */}
      {isAddingControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full space-y-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-white">Define Compliance Control</h3>
            <form onSubmit={handleSaveControl} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 uppercase tracking-widest font-black block mb-1">Control ID & Framework</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="e.g. A.9.2.1" required value={ctrlForm.controlId} onChange={e => setCtrlForm({ ...ctrlForm, controlId: e.target.value })} className="w-1/2 bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none" />
                  <select value={ctrlForm.framework} onChange={e => setCtrlForm({ ...ctrlForm, framework: e.target.value })} className="w-1/2 bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none">
                    {frameworks.filter(f => f !== 'All').map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 uppercase tracking-widest font-black block mb-1">Title</label>
                <input type="text" placeholder="e.g. User Registration Management" required value={ctrlForm.title} onChange={e => setCtrlForm({ ...ctrlForm, title: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none" />
              </div>
              <div>
                <label className="text-slate-400 uppercase tracking-widest font-black block mb-1">Objective & Requirement</label>
                <textarea placeholder="Specific compliance objective..." value={ctrlForm.objective} onChange={e => setCtrlForm({ ...ctrlForm, objective: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none min-h-[80px]" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsAddingControl(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white uppercase font-bold text-[10px]">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl uppercase font-black text-[10px] tracking-widest shadow-lg shadow-blue-500/20">Save Control</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD RISK MODAL */}
      {isAddingRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full space-y-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-white">Log Enterprise Risk Item</h3>
            <form onSubmit={handleSaveRisk} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 uppercase tracking-widest font-black block mb-1">Risk Title</label>
                <input type="text" placeholder="e.g. Data Exposure via Inadequate Access Control" required value={riskForm.title} onChange={e => setRiskForm({ ...riskForm, title: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none" />
              </div>
              <div>
                <label className="text-slate-400 uppercase tracking-widest font-black block mb-1">Threat / Vulnerability</label>
                <textarea placeholder="Description of threat actor and system vulnerability..." value={riskForm.threat} onChange={e => setRiskForm({ ...riskForm, threat: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none min-h-[80px]" />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-slate-400 uppercase tracking-widest font-black block mb-1">Likelihood (1-5)</label>
                  <select value={riskForm.likelihood} onChange={e => setRiskForm({ ...riskForm, likelihood: parseInt(e.target.value, 10) as any })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} - {n === 1 ? 'Rare' : n === 3 ? 'Moderate' : 'Almost Certain'}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="text-slate-400 uppercase tracking-widest font-black block mb-1">Impact (1-5)</label>
                  <select value={riskForm.impact} onChange={e => setRiskForm({ ...riskForm, impact: parseInt(e.target.value, 10) as any })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} - {n === 1 ? 'Insignificant' : n === 3 ? 'Moderate' : 'Catastrophic'}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsAddingRisk(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white uppercase font-bold text-[10px]">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl uppercase font-black text-[10px] tracking-widest shadow-lg shadow-blue-500/20">Log Risk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FINDING MODAL */}
      {isAddingFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full space-y-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-white">Record Audit Finding</h3>
            <form onSubmit={handleSaveFinding} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 uppercase tracking-widest font-black block mb-1">Finding Title & Severity</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Title of deficiency..." required value={findingForm.title} onChange={e => setFindingForm({ ...findingForm, title: e.target.value })} className="flex-1 bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none" />
                  <select value={findingForm.severity} onChange={e => setFindingForm({ ...findingForm, severity: e.target.value as any })} className="w-36 bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none">
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 uppercase tracking-widest font-black block mb-1">Root Cause & Recommended Action</label>
                <textarea placeholder="Root cause and remediation recommendation..." value={findingForm.recommendation} onChange={e => setFindingForm({ ...findingForm, recommendation: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none min-h-[80px]" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsAddingFinding(false)} className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white uppercase font-bold text-[10px]">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl uppercase font-black text-[10px] tracking-widest shadow-lg shadow-blue-500/20">Record Finding</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernanceHub;
