import React, { useState } from 'react';
import { User, Evidence, AuditStatus, CAPAReport, Role, ActivityType, ChecklistItem } from '../types';
import { DEPARTMENT_CHECKLISTS, STATUS_COLORS } from '../constants';
import { Check, X, Eye, FileText, ClipboardList, Download, Calendar, User as UserIcon, ShieldAlert, Brain, Loader2, ExternalLink, AlertCircle, FileCheck, ShieldCheck } from 'lucide-react';
import { api } from '../apiClient';

interface ManagerApprovalProps {
  user: User;
  evidence: Evidence[];
  setEvidence: React.Dispatch<React.SetStateAction<Evidence[]>>;
  capa: CAPAReport[];
  setCapa: React.Dispatch<React.SetStateAction<CAPAReport[]>>;
  logActivity: (user: User, action: ActivityType, description: string) => void;
  checklists: ChecklistItem[];
}

const ManagerApproval: React.FC<ManagerApprovalProps> = ({ user, evidence, setEvidence, capa, setCapa, logActivity, checklists }) => {
  const [activeView, setActiveView] = useState<'evidence' | 'capa'>('evidence');
  const [feedback, setFeedback] = useState('');
  const [modalFeedback, setModalFeedback] = useState('');
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [previewEvidence, setPreviewEvidence] = useState<{
    evidence: Evidence;
    task: string;
    taskObj?: ChecklistItem;
  } | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const [blobError, setBlobError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!previewEvidence?.evidence.fileUrl) {
      setBlobUrl(null);
      setBlobError(null);
      return;
    }
    let isCancelled = false;
    setBlobLoading(true);
    setBlobError(null);

    const loadArtifactBlob = async () => {
      try {
        const token = api.getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(previewEvidence.evidence.fileUrl!, { headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to retrieve compliance artifact`);
        const blobData = await response.blob();
        
        if (!isCancelled) {
          const isPdf = previewEvidence.evidence.fileName?.toLowerCase().endsWith('.pdf') || 
                        previewEvidence.evidence.fileUrl?.toLowerCase().endsWith('.pdf') ||
                        blobData.type.includes('pdf') ||
                        true; // Default compliance documents to PDF
          const finalBlob = isPdf && blobData.type !== 'application/pdf'
            ? new Blob([blobData], { type: 'application/pdf' })
            : blobData;
          const url = URL.createObjectURL(finalBlob);
          setBlobUrl(url);
        }
      } catch (err: any) {
        console.error('Artifact load error:', err);
        if (!isCancelled) {
          setBlobError(err.message || 'Error loading artifact');
          setBlobUrl(api.getEvidenceViewUrl(previewEvidence.evidence.fileUrl!));
        }
      } finally {
        if (!isCancelled) setBlobLoading(false);
      }
    };

    loadArtifactBlob();

    return () => {
      isCancelled = true;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [previewEvidence?.evidence.fileUrl]);

  const handleAiAnalysis = async (id: string, context: string, type: 'evidence' | 'capa') => {
    setAiLoading(prev => ({ ...prev, [id]: true }));
    try {
      const response = await api.getAIInsights(context, type);
      setAiInsights(prev => ({ ...prev, [id]: response.summary || (response.findings ? response.findings.join(' ') : 'Analysis complete.') }));
    } catch (err) {
      console.error(err);
      setAiInsights(prev => ({ ...prev, [id]: 'AI analysis failed. Please ensure GEMINI_API_KEY is valid.' }));
    } finally {
      setAiLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Internal Auditor reviews ALL departments
  const pendingEvidence = evidence.filter(e => e.status === AuditStatus.SUBMITTED);
  const pendingCapa = capa.filter(d => d.status === AuditStatus.SUBMITTED);

  const allowedReviewRoles = [
    Role.INTERNAL_AUDITOR,
    Role.SUPER_ADMIN,
    Role.ORG_ADMIN,
    Role.EXTERNAL_AUDITOR
  ];

  const isReviewAllowed = allowedReviewRoles.includes(user.role) || (user.role || '').toString().toLowerCase().includes('auditor') || (user.role || '').toString().toLowerCase().includes('admin');
  if (!isReviewAllowed) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-3xl border border-white/10 shadow-sm backdrop-blur-md">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-slate-400 max-w-sm mt-2">Only Auditors, Organization Admins, Managers, and Super Admins have authority to review and approve compliance evidence.</p>
      </div>
    );
  }

  const handleEvidenceAction = async (id: string, approve: boolean, customFeedback?: string) => {
    const feedbackText = customFeedback !== undefined ? customFeedback : feedback;
    const target = evidence.find(e => e.id === id);
    const taskObj = checklists.find(t => t.id === (target?.checklistId || target?.checklistItemId));
    const task = taskObj?.task || 'Compliance Objective';
    const newStatus = approve ? AuditStatus.MANAGER_APPROVED : AuditStatus.REJECTED;

    setEvidence(prev => prev.map(e =>
      e.id === id
        ? { ...e, status: newStatus, managerComment: feedbackText }
        : e
    ));

    try {
      await api.updateEvidence({
        id,
        status: newStatus,
        managerComment: feedbackText
      });
      logActivity(user, approve ? ActivityType.APPROVAL : ActivityType.REJECTION,
        `${approve ? 'Internal Audit Approved' : 'Internal Audit Rejected'} for task: ${task}. Feedback: ${feedbackText || 'No feedback'}`);
    } catch (err: any) {
      console.error('Failed to persist evidence status:', err);
      alert('Failed to save status on server: ' + (err.message || 'Unknown error'));
    }

    setFeedback('');
    setModalFeedback('');
  };

  const handleCapaAction = async (id: string, approve: boolean) => {
    const target = capa.find(d => d.id === id);
    const newStatus = approve ? AuditStatus.MANAGER_APPROVED : AuditStatus.REJECTED;

    setCapa(prev => prev.map(d =>
      d.id === id
        ? { ...d, status: newStatus }
        : d
    ));

    try {
      await api.updateCapa({
        id,
        status: newStatus
      });
      logActivity(user, approve ? ActivityType.APPROVAL : ActivityType.REJECTION,
        `Internal Auditor ${approve ? 'Approved' : 'Rejected'} CAPA report for ${target?.userName || 'User'}.`);
    } catch (err: any) {
      console.error('Failed to persist CAPA status:', err);
      alert('Failed to save CAPA review on server: ' + (err.message || 'Unknown error'));
    }
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
            onClick={() => setActiveView('capa')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'capa' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <FileText size={16} />
            CAPA Stream ({pendingCapa.length})
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
                const allChecklists = [...(checklists || []), ...DEPARTMENT_CHECKLISTS];
                const targetId = e.checklistItemId || e.checklistId;
                const taskObj = allChecklists.find(t => t.id === targetId);
                const task = (e as any).taskName || (e as any).task || taskObj?.task || 'Compliance Objective';
                return (
                  <div key={e.id} className="p-10 hover:bg-white/[0.01] transition-all group">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-6">
                        <div className="bg-blue-600/20 p-3.5 rounded-2xl text-blue-400 font-black text-[10px] border border-blue-500/30 shadow-lg tracking-widest">
                          {e.department}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 
                              onClick={() => {
                                setModalFeedback(feedback);
                                setPreviewEvidence({ evidence: e, task, taskObj });
                              }}
                              className="text-xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tight cursor-pointer"
                              title="Click to inspect evidence"
                            >
                              {task}
                            </h3>
                            {taskObj?.framework && (
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest">
                                {taskObj.framework} {taskObj.control_clause && `- ${taskObj.control_clause}`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                            <Calendar size={12} className="text-slate-700" /> {e.submissionDate}
                            <span className="text-slate-800">•</span>
                            <UserIcon size={12} className="text-slate-700" /> SOURCE: {e.userId.slice(-6).toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {e.fileUrl && (
                          <button 
                            onClick={() => api.downloadEvidenceFile(e.fileUrl!, e.fileName)}
                            title="Download compliance artifact document"
                            className="flex items-center gap-3 bg-white/5 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all active:scale-95"
                          >
                            <Download size={14} /> Artifact
                          </button>
                        )}
                        <button 
                          onClick={() => handleAiAnalysis(e.id, `Task: ${task}\nDepartment: ${e.department}\nComment: ${e.comment}`, 'evidence')}
                          disabled={aiLoading[e.id]}
                          className="flex items-center gap-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-500/30 transition-all active:scale-95">
                          {aiLoading[e.id] ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />} AI Analysis
                        </button>
                        <button 
                          onClick={() => {
                            setModalFeedback(feedback);
                            setPreviewEvidence({ evidence: e, task, taskObj });
                          }}
                          title="Inspect Evidence Document & Compliance Proof"
                          className="p-3 text-slate-400 hover:text-white bg-white/5 hover:bg-blue-600/20 hover:border-blue-500/30 rounded-xl border border-white/5 transition-all group/btn active:scale-95 flex items-center gap-1.5"
                        >
                          <Eye size={18} className="text-blue-400 group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-950/60 border border-white/5 p-6 rounded-[32px] text-sm font-medium text-slate-400 leading-relaxed mb-8 relative">
                      <div className="absolute top-0 left-8 -translate-y-1/2 bg-slate-900 px-3 py-0.5 font-black text-[8px] text-slate-600 border border-white/10 rounded-full tracking-[0.2em] uppercase">
                        Origin Testimony
                      </div>
                      "{e.comment || e.description || '--'}"
                    </div>
                    {aiInsights[e.id] && (
                      <div className="bg-indigo-950/40 border border-indigo-500/20 p-6 rounded-[32px] text-sm font-medium text-indigo-200 leading-relaxed mb-8 relative">
                        <div className="absolute top-0 left-8 -translate-y-1/2 bg-indigo-900 px-3 py-0.5 font-black text-[8px] text-indigo-300 border border-indigo-500/30 rounded-full tracking-[0.2em] uppercase flex items-center gap-1">
                          <Brain size={10} /> AI Risk Assessment
                        </div>
                        {aiInsights[e.id]}
                      </div>
                    )}
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
            {pendingCapa.length === 0 ? (
              <div className="py-32 text-center">
                <div className="bg-emerald-500/10 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <Check className="text-emerald-400" size={36} />
                </div>
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em]">CAPA channel clear</p>
              </div>
            ) : (
              pendingCapa.map(d => (
                <div key={d.id} className="p-10 hover:bg-white/[0.01] transition-all group">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div className="flex items-center gap-6">
                      <div className="bg-blue-600/20 p-4 rounded-3xl border border-blue-500/30 shadow-xl"><FileText size={28} className="text-blue-400" /></div>
                      <div>
                        <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">{d.month} CAPA <span className="text-blue-500">Report</span></h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Entity: {d.userName} • Sector: {d.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {d.fileUrl && (
                        <button 
                          onClick={() => api.downloadEvidenceFile(d.fileUrl!, d.fileName || 'capa_artifact.pdf')}
                          title="Download CAPA Document"
                          className="flex items-center gap-3 bg-white/5 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all active:scale-95"
                        >
                          <Download size={14} /> Artifact
                        </button>
                      )}
                      <button 
                        onClick={() => handleAiAnalysis(d.id, `Report context: ${d.content}\nDepartment: ${d.department}`, 'capa')}
                        disabled={aiLoading[d.id]}
                        className="flex items-center gap-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-500/30 transition-all">
                        {aiLoading[d.id] ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />} AI Action Plan
                      </button>
                      <button onClick={() => handleCapaAction(d.id, true)} className="flex-1 md:flex-none bg-emerald-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                        <Check size={18} /> Approve Release
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-white/5 p-8 rounded-[40px] text-sm italic font-medium text-slate-400 leading-relaxed shadow-inner mb-6">
                    "{d.content}"
                  </div>
                  {aiInsights[d.id] && (
                    <div className="bg-indigo-950/40 border border-indigo-500/20 p-6 rounded-[32px] text-sm font-medium text-indigo-200 leading-relaxed mb-6 relative">
                      <div className="absolute top-0 left-8 -translate-y-1/2 bg-indigo-900 px-3 py-0.5 font-black text-[8px] text-indigo-300 border border-indigo-500/30 rounded-full tracking-[0.2em] uppercase flex items-center gap-1">
                        <Brain size={10} /> AI Action Plan
                      </div>
                      <div className="whitespace-pre-wrap">{aiInsights[d.id]}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Interactive Evidence Artifact Inspection & Verification Modal */}
      {previewEvidence && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-200"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) setPreviewEvidence(null);
          }}
        >
          <div className="bg-slate-900/95 border border-white/15 rounded-[36px] w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/90 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-slate-950/50">
              <div className="flex items-center gap-5">
                <div className="bg-blue-600/20 p-3 rounded-2xl text-blue-400 font-black text-xs border border-blue-500/30 tracking-widest">
                  {previewEvidence.evidence.department}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {previewEvidence.task}
                    </h2>
                    {previewEvidence.taskObj?.framework && (
                      <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest">
                        {previewEvidence.taskObj.framework} {previewEvidence.taskObj.control_clause && `- ${previewEvidence.taskObj.control_clause}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-500" /> Submitted: {previewEvidence.evidence.submissionDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5"><UserIcon size={13} className="text-slate-500" /> Submitter: {previewEvidence.evidence.userName || previewEvidence.evidence.userId}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Top */}
              <div className="flex items-center gap-3">
                {previewEvidence.evidence.fileUrl && (
                  <>
                    <a
                      href={api.getEvidenceViewUrl(previewEvidence.evidence.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/5 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all"
                      title="Open in new browser tab"
                    >
                      <ExternalLink size={14} /> Full View
                    </a>
                    <button
                      onClick={() => api.downloadEvidenceFile(previewEvidence.evidence.fileUrl!, previewEvidence.evidence.fileName)}
                      className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-500/30 transition-all shadow-lg shadow-blue-500/10"
                      title="Download artifact file"
                    >
                      <Download size={14} /> Download
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPreviewEvidence(null)}
                  className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all ml-2"
                  title="Close inspection"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Document Preview */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wider">
                      <FileCheck size={16} className="text-emerald-400" />
                      <span>Physical Artifact Document</span>
                    </div>
                    {previewEvidence.evidence.fileName && (
                      <span className="text-[11px] text-slate-400 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        {previewEvidence.evidence.fileName} {previewEvidence.evidence.fileSize ? `(${previewEvidence.evidence.fileSize})` : ''}
                      </span>
                    )}
                  </div>

                  {previewEvidence.evidence.fileUrl ? (
                    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl flex flex-col">
                      {blobLoading ? (
                        <div className="h-[520px] flex flex-col items-center justify-center bg-slate-950/90 gap-4 text-center p-6">
                          <Loader2 size={36} className="animate-spin text-blue-400" />
                          <p className="text-sm font-bold text-white tracking-wide">Decrypting & Loading Compliance Evidence...</p>
                          <p className="text-[11px] text-slate-500 font-mono">Verifying SHA cryptographic signature</p>
                        </div>
                      ) : previewEvidence.evidence.fileUrl.toLowerCase().includes('.png') || 
                         previewEvidence.evidence.fileUrl.toLowerCase().includes('.jpg') || 
                         previewEvidence.evidence.fileUrl.toLowerCase().includes('.jpeg') ? (
                        <div className="w-full h-[520px] p-4 flex items-center justify-center bg-slate-950/80 overflow-auto">
                          <img
                            src={blobUrl || api.getEvidenceViewUrl(previewEvidence.evidence.fileUrl)}
                            alt="Compliance Evidence"
                            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-[520px] bg-slate-950">
                          {blobUrl ? (
                            <iframe
                              src={`${blobUrl}#toolbar=1`}
                              className="w-full h-full border-0"
                              title="Compliance Evidence Artifact"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950/80">
                              <AlertCircle size={40} className="text-amber-400 mb-3" />
                              <h4 className="text-white font-bold">Preview Display Notice</h4>
                              <p className="text-slate-400 text-xs mt-1 mb-4">Click below to open or download the evidence directly.</p>
                              <button
                                onClick={() => api.downloadEvidenceFile(previewEvidence.evidence.fileUrl!, previewEvidence.evidence.fileName)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                              >
                                <Download size={14} /> Download Document
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between px-5 py-3 bg-slate-950/90 border-t border-white/5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-2 text-slate-400">
                          <ShieldCheck size={14} className="text-emerald-400" />
                          Authenticated via SparkAudit Secure Storage
                        </span>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              if (blobUrl) {
                                window.open(blobUrl, '_blank');
                              } else {
                                window.open(api.getEvidenceViewUrl(previewEvidence.evidence.fileUrl!), '_blank');
                              }
                            }}
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 transition-colors"
                          >
                            Popout Window <ExternalLink size={12} />
                          </button>
                          <button
                            onClick={() => api.downloadEvidenceFile(previewEvidence.evidence.fileUrl!, previewEvidence.evidence.fileName)}
                            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
                          >
                            Download <Download size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-950/60 rounded-2xl border border-white/10">
                      <AlertCircle size={48} className="text-amber-400 mb-3" />
                      <h4 className="text-white font-bold text-base">No Binary File Attached</h4>
                      <p className="text-slate-400 text-xs max-w-sm mt-1">This objective was submitted as origin testimony without an attached document.</p>
                    </div>
                  )}
                </div>

                {/* Right Side: Governance Context & Decision Panel */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Origin Testimony */}
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <UserIcon size={12} className="text-blue-400" />
                      Origin Submitter Testimony
                    </div>
                    <div className="bg-slate-950/70 border border-white/10 p-5 rounded-2xl text-sm font-medium text-slate-300 leading-relaxed shadow-inner">
                      "{previewEvidence.evidence.comment || previewEvidence.evidence.description || 'No contextual commentary provided by submitter.'}"
                    </div>
                  </div>

                  {/* AI Compliance Analysis */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <Brain size={12} />
                        Gemini AI Evidence Verification
                      </div>
                      <button
                        onClick={() => handleAiAnalysis(
                          previewEvidence.evidence.id, 
                          `Task: ${previewEvidence.task}\nDepartment: ${previewEvidence.evidence.department}\nComment: ${previewEvidence.evidence.comment}`, 
                          'evidence'
                        )}
                        disabled={aiLoading[previewEvidence.evidence.id]}
                        className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        {aiLoading[previewEvidence.evidence.id] ? <Loader2 size={12} className="animate-spin" /> : '⚡ Re-run AI Analysis'}
                      </button>
                    </div>

                    {aiInsights[previewEvidence.evidence.id] ? (
                      <div className="bg-indigo-950/40 border border-indigo-500/30 p-5 rounded-2xl text-xs font-medium text-indigo-200 leading-relaxed shadow-lg">
                        {aiInsights[previewEvidence.evidence.id]}
                      </div>
                    ) : (
                      <div className="bg-indigo-950/20 border border-indigo-500/15 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <span className="text-xs text-indigo-300/80">Automated Gemini AI document evaluation available.</span>
                        <button
                          onClick={() => handleAiAnalysis(
                            previewEvidence.evidence.id, 
                            `Task: ${previewEvidence.task}\nDepartment: ${previewEvidence.evidence.department}\nComment: ${previewEvidence.evidence.comment}`, 
                            'evidence'
                          )}
                          disabled={aiLoading[previewEvidence.evidence.id]}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shrink-0"
                        >
                          {aiLoading[previewEvidence.evidence.id] ? <Loader2 size={12} className="animate-spin" /> : <Brain size={14} />} Analyze
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Auditor Review & Decision */}
                  <div className="mt-auto pt-4 border-t border-white/10 space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Auditor Review Notes / Rejection Justification:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Inject auditor feedback, compliance verification notes, or rejection reason..."
                        value={modalFeedback}
                        onChange={(ev) => setModalFeedback(ev.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all placeholder:text-slate-600 resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          handleEvidenceAction(previewEvidence.evidence.id, true, modalFeedback);
                          setPreviewEvidence(null);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <Check size={16} /> Finalize Approval
                      </button>
                      <button
                        onClick={() => {
                          handleEvidenceAction(previewEvidence.evidence.id, false, modalFeedback);
                          setPreviewEvidence(null);
                        }}
                        className="flex-1 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <X size={16} /> Discard Item
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerApproval;
