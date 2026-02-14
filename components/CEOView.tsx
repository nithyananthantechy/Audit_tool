
import React, { useState } from 'react';
/* Fix: Added User and ActivityType to the imports */
import { Evidence, DMAXReport, AuditStatus, Department, Role, User, ActivityType } from '../types';
import { STATUS_COLORS } from '../constants';
import { Download, Filter, ShieldCheck, CheckCircle, Clock, FileText, ChevronDown, ListChecks, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CEOViewProps {
  evidence: Evidence[];
  dmax: DMAXReport[];
  setEvidence: React.Dispatch<React.SetStateAction<Evidence[]>>;
  setDmax: React.Dispatch<React.SetStateAction<DMAXReport[]>>;
  user: User;
  logActivity: (user: User, action: ActivityType, description: string) => void;
}

const CEOView: React.FC<CEOViewProps> = ({ evidence, dmax, setEvidence, setDmax, user, logActivity }) => {
  const [filterDept, setFilterDept] = useState<Department | 'All'>('All');
  const [activeReportTab, setActiveReportTab] = useState<'evidence' | 'dmax'>('evidence');

  if (user.role !== Role.EXTERNAL_AUDITOR && user.role !== Role.SUPER_ADMIN) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Permission Denied</h2>
        <p className="text-slate-500 max-w-sm mt-2">Only External Auditors (CGO/CEO) have authority for final corporate compliance certification.</p>
      </div>
    );
  }

  const filteredEvidence = filterDept === 'All' ? evidence : evidence.filter(e => e.department === filterDept);
  const filteredDmax = filterDept === 'All' ? dmax : dmax.filter(d => d.department === filterDept);

  const handleFinalAuditEvidence = (id: string) => {
    setEvidence(prev => prev.map(e => e.id === id ? { ...e, status: AuditStatus.FINAL_AUDIT_COMPLETED } : e));
    logActivity(user, ActivityType.APPROVAL, `External Auditor performed final sign-off for checklist item ID: ${id}`);
  };

  const handleFinalAuditDmax = (id: string) => {
    setDmax(prev => prev.map(d => d.id === id ? { ...d, status: AuditStatus.FINAL_AUDIT_COMPLETED } : d));
    logActivity(user, ActivityType.APPROVAL, `External Auditor certified DMAX report ID: ${id}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
              <ShieldCheck className="text-blue-400" size={24} />
            </div>
            Corporate <span className="text-blue-500">Sign-off</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Executive Certification & External Audit Ledger</p>
        </div>
        <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all shadow-2xl active:scale-[0.98]">
          <Download size={18} className="text-blue-400" /> Export Compliance Ledger
        </button>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[40px] border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
          <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveReportTab('evidence')}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeReportTab === 'evidence' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <ListChecks size={16} /> Compliance Audit
            </button>
            <button
              onClick={() => setActiveReportTab('dmax')}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeReportTab === 'dmax' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <FileText size={16} /> DMAX Ledger
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {['All', ...Object.values(Department)].map(d => (
              <button
                key={d}
                onClick={() => setFilterDept(d as any)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterDept === d ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg' : 'bg-white/5 text-slate-500 border border-white/5 hover:border-white/10 hover:text-white'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Corporate Directive</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Validation Status</th>
                <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Certification Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeReportTab === 'evidence' ? (
                filteredEvidence.filter(e => e.status !== AuditStatus.REJECTED && e.status !== AuditStatus.DRAFT).map(e => (
                  <tr key={e.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600/10 text-blue-400 flex items-center justify-center rounded-xl font-black text-sm border border-blue-500/10">
                          {e.department.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{e.department} Audit Unit #{e.checklistItemId.slice(-4).toUpperCase()}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-1 italic leading-relaxed max-w-md">"{e.comment}"</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border shadow-sm ${STATUS_COLORS[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {e.status === AuditStatus.FINAL_AUDIT_COMPLETED ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest animate-in zoom-in-95">
                          <CheckCircle size={14} /> Certified Secure
                        </div>
                      ) : (
                        <button
                          onClick={() => handleFinalAuditEvidence(e.id)}
                          disabled={e.status !== AuditStatus.MANAGER_APPROVED}
                          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-500 disabled:opacity-20 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
                        >
                          Push Sign-off
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                filteredDmax.map(d => (
                  <tr key={d.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600/10 text-indigo-400 flex items-center justify-center rounded-xl font-black text-sm border border-indigo-500/10">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{d.userName} • {d.month} Report</p>
                          <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mt-1">Sector: {d.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border shadow-sm ${STATUS_COLORS[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {d.status === AuditStatus.FINAL_AUDIT_COMPLETED ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest">
                          <CheckCircle size={14} /> Certified
                        </div>
                      ) : (
                        <button
                          onClick={() => handleFinalAuditDmax(d.id)}
                          disabled={d.status !== AuditStatus.MANAGER_APPROVED}
                          className="bg-white/5 text-white hover:bg-white/10 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 disabled:opacity-20 transition-all"
                        >
                          Certify Ledger
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CEOView;
