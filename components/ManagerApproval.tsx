
import React, { useState } from 'react';
import { User, Evidence, AuditStatus, DMAXReport, Role, ActivityType } from '../types';
import { DEPARTMENT_CHECKLISTS, STATUS_COLORS } from '../constants';
import { Check, X, Eye, FileText, ClipboardList, Download, Calendar, User as UserIcon, ShieldAlert } from 'lucide-react';

interface ManagerApprovalProps {
  user: User;
  evidence: Evidence[];
  setEvidence: React.Dispatch<React.SetStateAction<Evidence[]>>;
  dmax: DMAXReport[];
  setDmax: React.Dispatch<React.SetStateAction<DMAXReport[]>>;
  logActivity: (user: User, action: ActivityType, description: string) => void;
}

const ManagerApproval: React.FC<ManagerApprovalProps> = ({ user, evidence, setEvidence, dmax, setDmax, logActivity }) => {
  const [activeView, setActiveView] = useState<'evidence' | 'dmax'>('evidence');
  const [feedback, setFeedback] = useState('');

  // Internal Auditor reviews ALL departments
  const pendingEvidence = evidence.filter(e => e.status === AuditStatus.SUBMITTED);
  const pendingDmax = dmax.filter(d => d.status === AuditStatus.SUBMITTED);

  if (user.role !== Role.INTERNAL_AUDITOR) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm mt-2">Only Internal Auditors have permission to review and approve compliance evidence.</p>
      </div>
    );
  }

  const handleEvidenceAction = (id: string, approve: boolean) => {
    const target = evidence.find(e => e.id === id);
    const task = DEPARTMENT_CHECKLISTS.find(t => t.id === target?.checklistItemId)?.task;

    setEvidence(prev => prev.map(e =>
      e.id === id
        ? { ...e, status: approve ? AuditStatus.MANAGER_APPROVED : AuditStatus.REJECTED, managerComment: feedback }
        : e
    ));

    logActivity(user, approve ? ActivityType.APPROVAL : ActivityType.REJECTION,
      `${approve ? 'Internal Audit Approved' : 'Internal Audit Rejected'} for task: ${task}. Feedback: ${feedback || 'No feedback'}`);

    setFeedback('');
  };

  const handleDmaxAction = (id: string, approve: boolean) => {
    const target = dmax.find(d => d.id === id);
    setDmax(prev => prev.map(d =>
      d.id === id
        ? { ...d, status: approve ? AuditStatus.MANAGER_APPROVED : AuditStatus.REJECTED }
        : d
    ));

    logActivity(user, approve ? ActivityType.APPROVAL : ActivityType.REJECTION,
      `Internal Auditor ${approve ? 'Approved' : 'Rejected'} DMAX report for ${target?.userName}.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Auditor <span className="text-blue-500">Inbox</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Verification Queue & Governance Node</p>
        </div>
        <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
          <button
            onClick={() => setActiveView('evidence')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'evidence' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <ClipboardList size={16} />
            Compliance Queue ({pendingEvidence.length})
          </button>
          <button
            onClick={() => setActiveView('dmax')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'dmax' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <FileText size={16} />
            DMAX Stream ({pendingDmax.length})
          </button>
        </div>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[40px] border border-white/[0.08] overflow-hidden shadow-2xl">
        {activeView === 'evidence' ? (
          <div className="divide-y divide-white/5">
            {pendingEvidence.length === 0 ? (
              <div className="py-32 text-center">
                <div className="bg-emerald-500/10 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <Check className="text-emerald-400" size={36} />
                </div>
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em]">All nodes cleared</p>
              </div>
            ) : (
              pendingEvidence.map(e => {
                const task = DEPARTMENT_CHECKLISTS.find(t => t.id === e.checklistItemId)?.task;
                return (
                  <div key={e.id} className="p-10 hover:bg-white/[0.01] transition-all group">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-6">
                        <div className="bg-blue-600/20 p-3.5 rounded-2xl text-blue-400 font-black text-[10px] border border-blue-500/30 shadow-lg tracking-widest">
                          {e.department}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">{task}</h3>
                          <div className="flex items-center gap-4 mt-2 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                            <Calendar size={12} className="text-slate-700" /> {e.submissionDate}
                            <span className="text-slate-800">•</span>
                            <UserIcon size={12} className="text-slate-700" /> SOURCE: {e.userId.slice(-6).toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {e.fileUrl && (
                          <button className="flex items-center gap-3 bg-white/5 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">
                            <Download size={14} /> Artifact
                          </button>
                        )}
                        <button className="p-3 text-slate-600 hover:text-white bg-white/5 rounded-xl border border-white/5 transition-all"><Eye size={18} /></button>
                      </div>
                    </div>
                    <div className="bg-slate-950/60 border border-white/5 p-6 rounded-[32px] text-sm font-medium text-slate-400 leading-relaxed mb-8 relative">
                      <div className="absolute top-0 left-8 -translate-y-1/2 bg-slate-900 px-3 py-0.5 font-black text-[8px] text-slate-600 border border-white/10 rounded-full tracking-[0.2em] uppercase">
                        Origin Testimony
                      </div>
                      "{e.comment}"
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                      <div className="relative flex-1 w-full">
                        <input
                          placeholder="Inject feedback or rejection log..."
                          className="w-full bg-slate-950/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-medium text-white outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all placeholder:text-slate-800"
                          value={feedback}
                          onChange={(ev) => setFeedback(ev.target.value)}
                        />
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={() => handleEvidenceAction(e.id, true)} className="flex-1 sm:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                          <Check size={16} /> Finalize Approval
                        </button>
                        <button onClick={() => handleEvidenceAction(e.id, false)} className="flex-1 sm:flex-none bg-red-600/10 text-red-500 border border-red-500/20 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-[0.98]">
                          <X size={16} /> Discard Item
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pendingDmax.length === 0 ? (
              <div className="py-32 text-center">
                <div className="bg-emerald-500/10 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <Check className="text-emerald-400" size={36} />
                </div>
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em]">DMAX channel clear</p>
              </div>
            ) : (
              pendingDmax.map(d => (
                <div key={d.id} className="p-10 hover:bg-white/[0.01] transition-all group">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div className="flex items-center gap-6">
                      <div className="bg-blue-600/20 p-4 rounded-3xl border border-blue-500/30 shadow-xl"><FileText size={28} className="text-blue-400" /></div>
                      <div>
                        <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">{d.month} DMAX <span className="text-blue-500">Report</span></h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Entity: {d.userName} • Sector: {d.department}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDmaxAction(d.id, true)} className="w-full md:w-auto bg-emerald-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                      <Check size={18} /> Approve Release
                    </button>
                  </div>
                  <div className="bg-slate-950/60 border border-white/5 p-8 rounded-[40px] text-sm italic font-medium text-slate-400 leading-relaxed shadow-inner">
                    "{d.content}"
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerApproval;
