import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle, Clock, ShieldAlert, Layers, Server, Database, Cloud, Building, FileText, ChevronRight } from 'lucide-react';
import { apiClient } from '../apiClient';
import { AuditRecord, AuditScope, User } from '../types';

interface AuditManagerProps {
  user: User;
}

export const AuditManager: React.FC<AuditManagerProps> = ({ user }) => {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);
  const [selectedScope, setSelectedScope] = useState<AuditScope | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [auditName, setAuditName] = useState('');
  const [auditType, setAuditType] = useState('ISO 27001 Audit');
  const [period, setPeriod] = useState('Q3-2026');
  const [leadAuditor, setLeadAuditor] = useState(user.name);
  const [description, setDescription] = useState('');
  const [inScopeApps, setInScopeApps] = useState('HR Portal, Core Payment API, Cloud Storage');
  const [servers, setServers] = useState('AWS EC2 prod-app-01, prod-db-primary');
  const [cloudEnvs, setCloudEnvs] = useState('AWS ap-south-1 (Mumbai), Azure East US');
  const [outOfScope, setOutOfScope] = useState('Legacy On-prem Payroll Server (Decommissioned)');
  const [justification, setJustification] = useState('System is fully isolated and slated for retirement in Q4.');

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAudits();
      setAudits(res || []);
      if (res && res.length > 0) {
        setSelectedAudit(res[0]);
        loadScope(res[0].id);
      }
    } catch (err) {
      console.error('Failed to load audits:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadScope = async (auditId: string) => {
    try {
      const scope = await apiClient.getAuditScope(auditId);
      setSelectedScope(scope || null);
    } catch (err) {
      console.error('Failed to load scope:', err);
    }
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditName.trim()) return;

    try {
      await apiClient.createAudit({
        name: auditName,
        type: auditType,
        period,
        leadAuditor,
        description,
        inScopeApps: inScopeApps.split(',').map(s => s.trim()),
        servers: servers.split(',').map(s => s.trim()),
        cloudEnvs: cloudEnvs.split(',').map(s => s.trim()),
        outOfScope: outOfScope.split(',').map(s => s.trim()),
        justification
      });
      setShowCreateModal(false);
      setAuditName('');
      loadAudits();
    } catch (err) {
      alert('Failed to create audit.');
    }
  };

  const handleUpdateStatus = async (auditId: string, status: string) => {
    try {
      await apiClient.updateAudit(auditId, { status });
      loadAudits();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
              <Target size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Audit & Scope Governance</h1>
              <p className="text-slate-400 text-sm">Manage enterprise compliance audit lifecycles, scopes, and target boundaries</p>
            </div>
          </div>
        </div>

        {(user.role.includes('Admin') || user.role.includes('Auditor')) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            <span>Initiate New Audit</span>
          </button>
        )}
      </div>

      {/* Audit Lifecycle Stages */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {['Planning', 'Fieldwork', 'Testing', 'Findings Review', 'Remediation', 'Closed'].map((stage, idx) => {
          const isActive = selectedAudit?.status === stage;
          return (
            <div
              key={stage}
              className={`p-4 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-blue-600/20 border-blue-500/50 shadow-md text-white'
                  : 'bg-slate-900/40 border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-1">
                <span>Stage {idx + 1}</span>
                {isActive && <CheckCircle size={14} className="text-blue-400" />}
              </div>
              <div className="text-sm font-bold">{stage}</div>
            </div>
          );
        })}
      </div>

      {/* Audits Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Audits List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers size={20} className="text-blue-400" />
            <span>Active Audits ({audits.length})</span>
          </h2>

          <div className="space-y-3">
            {audits.map((a) => {
              const isSelected = selectedAudit?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => {
                    setSelectedAudit(a);
                    loadScope(a.id);
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500/40 shadow-lg text-white'
                      : 'bg-slate-900/40 border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-blue-500/20 text-blue-300 rounded-lg">
                      {a.auditId || a.id.slice(0, 8)}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                      {a.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">{a.name}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-white/5">
                    <span>Lead: {a.leadAuditor}</span>
                    <span>{a.period}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Audit Details & Scope */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAudit ? (
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl space-y-6">
              {/* Audit Header Banner */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
                    <span>{selectedAudit.auditId}</span>
                    <span>•</span>
                    <span>{selectedAudit.type}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedAudit.name}</h2>
                  <p className="text-slate-400 text-sm mt-1">{selectedAudit.description || 'No description provided.'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedAudit.status}
                    onChange={(e) => handleUpdateStatus(selectedAudit.id, e.target.value)}
                    className="bg-slate-800 text-white text-sm px-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Planning">Planning</option>
                    <option value="Fieldwork">Fieldwork</option>
                    <option value="Testing">Testing</option>
                    <option value="Findings Review">Findings Review</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Audit Scope Grid */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Server size={18} className="text-purple-400" />
                  <span>Audit Scope & Boundary Boundaries</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
                      <CheckCircle size={14} />
                      <span>In-Scope Applications & APIs</span>
                    </div>
                    <p className="text-sm text-slate-300 font-mono">
                      {selectedScope?.inScopeApps ? (Array.isArray(selectedScope.inScopeApps) ? selectedScope.inScopeApps.join(', ') : selectedScope.inScopeApps) : 'HR Portal, Payment Gateway API, AWS Services'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase">
                      <Cloud size={14} />
                      <span>Cloud & Infrastructure Systems</span>
                    </div>
                    <p className="text-sm text-slate-300 font-mono">
                      {selectedScope?.cloudEnvs ? (Array.isArray(selectedScope.cloudEnvs) ? selectedScope.cloudEnvs.join(', ') : selectedScope.cloudEnvs) : 'AWS Mumbai (ap-south-1), Production Aurora DB'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase">
                      <ShieldAlert size={14} />
                      <span>Exclusions & Out-of-Scope Systems</span>
                    </div>
                    <p className="text-sm text-slate-300 font-mono">
                      {selectedScope?.outOfScope ? (Array.isArray(selectedScope.outOfScope) ? selectedScope.outOfScope.join(', ') : selectedScope.outOfScope) : 'Legacy On-prem Payroll Server'}
                    </p>
                    <p className="text-xs text-slate-400 italic mt-1">
                      Justification: {selectedScope?.justification || 'System fully isolated from production network.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-3xl border border-white/5">
              Select an audit to inspect scope details.
            </div>
          )}
        </div>
      </div>

      {/* Create Audit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Initiate Enterprise Audit</h2>
            <form onSubmit={handleCreateAudit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Audit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 2026 ISO 27001 & DPDP Audit"
                  value={auditName}
                  onChange={(e) => setAuditName(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Audit Type</label>
                  <select
                    value={auditType}
                    onChange={(e) => setAuditType(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ISO 27001 Audit">ISO 27001 Audit</option>
                    <option value="DPDP Privacy Audit">DPDP Privacy Audit</option>
                    <option value="SOC 2 Type II">SOC 2 Type II</option>
                    <option value="CERT-In Security Compliance">CERT-In Security Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Audit Period</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">In-Scope Systems & Apps</label>
                <input
                  type="text"
                  value={inScopeApps}
                  onChange={(e) => setInScopeApps(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Out of Scope & Exclusion Justification</label>
                <textarea
                  rows={2}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20"
                >
                  Create Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
