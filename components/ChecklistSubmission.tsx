
import React, { useState, useEffect } from 'react';
import { User, Evidence, AuditStatus, Department, ActivityType } from '../types';
import { DEPARTMENT_CHECKLISTS, STATUS_COLORS } from '../constants';
import { Upload, Plus, AlertCircle, CheckCircle2, X, FileText, Loader2, ClipboardList, Calendar, ChevronRight } from 'lucide-react';

interface ChecklistProps {
  user: User;
  evidence: Evidence[];
  setEvidence: React.Dispatch<React.SetStateAction<Evidence[]>>;
  logActivity: (user: User, action: ActivityType, description: string) => void;
}

const MAX_COMMENT_LENGTH = 1000;

const ChecklistSubmission: React.FC<ChecklistProps> = ({ user, evidence, setEvidence, logActivity }) => {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [comment, setComment] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const departmentTasks = DEPARTMENT_CHECKLISTS.filter(t => t.department === user.department);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileUrl(`file://${file.name}`);
      setError('');
    }
  };

  const removeFile = () => {
    setFileName('');
    setFileUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTaskId) {
      setError('Please select a checklist item.');
      return;
    }
    if (!comment.trim()) {
      setError('Comments are required.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const taskObj = departmentTasks.find(t => t.id === selectedTaskId);
      const newEvidence: Evidence = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        checklistItemId: selectedTaskId,
        department: user.department,
        submissionDate: new Date().toISOString().split('T')[0],
        fileUrl: fileUrl,
        comment: comment,
        status: AuditStatus.SUBMITTED
      };

      setEvidence(prev => [...prev, newEvidence]);
      logActivity(user, ActivityType.SUBMISSION, `Submitted evidence for task: ${taskObj?.task || selectedTaskId}`);

      setSelectedTaskId('');
      setComment('');
      setFileName('');
      setFileUrl('');
      setIsSubmitting(false);
      setShowSuccess(true);

      // Auto-hide success message
      setTimeout(() => setShowSuccess(false), 5000);
    }, 1200);
  };

  const mySubmissions = evidence.filter(e => e.userId === user.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white/[0.03] backdrop-blur-2xl p-10 rounded-[40px] border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-4 tracking-tight">
              <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
                <Plus className="text-blue-400" size={24} />
              </div>
              New Evidence <span className="text-blue-500">Submission</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Compliance & Data Verification Portal</p>
          </div>
          {showSuccess && (
            <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest animate-in slide-in-from-right-8">
              <CheckCircle2 size={18} />
              Protocol Synchronized
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="checklist-item" className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">
                Audit Objective <span className="text-blue-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="checklist-item"
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full h-14 px-6 bg-slate-950 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none appearance-none"
                >
                  <option value="" className="bg-slate-900">Select objective...</option>
                  {departmentTasks.map(task => (
                    <option key={task.id} value={task.id} className="bg-slate-900">{task.task}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={18} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">
                Binary Attachment
              </label>
              {!fileName ? (
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="file-upload"
                  />
                  <div className="flex items-center gap-4 w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-6 text-sm font-bold text-slate-500 group-hover:border-blue-500/50 group-hover:bg-blue-600/5 transition-all outline-none">
                    <Upload size={18} className="text-slate-600 group-hover:text-blue-400" />
                    <span>Push PDF, Doc, or Binary</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between h-14 bg-blue-600/10 border border-blue-500/30 rounded-2xl px-6 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText size={18} className="text-blue-400 flex-shrink-0" />
                    <span className="text-sm font-bold text-white truncate">{fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="comments" className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                Contextual Commentary <span className="text-blue-500">*</span>
              </label>
              <span className={`text-[10px] font-black uppercase tracking-widest ${comment.length > MAX_COMMENT_LENGTH * 0.9 ? 'text-red-500' : 'text-slate-600'}`}>
                {comment.length} / {MAX_COMMENT_LENGTH}
              </span>
            </div>
            <textarea
              id="comments"
              value={comment}
              maxLength={MAX_COMMENT_LENGTH}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-3xl p-6 text-sm font-medium text-white placeholder:text-slate-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none min-h-[160px] leading-relaxed"
              placeholder="Describe the compliance evidence in detail..."
            ></textarea>
          </div>

          {error && (
            <div className="flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/5 p-4 rounded-2xl border border-red-500/20 animate-in slide-in-from-left-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !selectedTaskId || !comment.trim()}
              className="w-full sm:w-auto px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-500 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  Push to Auditor Inbox
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[40px] border border-white/[0.08] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Transmission <span className="text-blue-500">History</span></h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Personal Verification Log</p>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] bg-white/5 px-4 py-2 rounded-full border border-white/5">
            Real-time Sync
          </span>
        </div>
        <div className="divide-y divide-white/5">
          {mySubmissions.length === 0 ? (
            <div className="py-24 text-center">
              <div className="bg-white/5 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-white/5">
                <ClipboardList className="text-slate-700" size={36} />
              </div>
              <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em]">No records found in current node</p>
            </div>
          ) : (
            [...mySubmissions].reverse().map(e => {
              const taskLabel = DEPARTMENT_CHECKLISTS.find(t => t.id === e.checklistItemId)?.task;
              return (
                <div key={e.id} className="p-8 hover:bg-white/[0.01] transition-all group">
                  <div className="flex items-start gap-6">
                    <div className={`mt-1 p-3.5 rounded-2xl shadow-lg border ${e.status === AuditStatus.REJECTED ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      e.status === AuditStatus.MANAGER_APPROVED ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                      {e.status === AuditStatus.REJECTED ? <AlertCircle size={22} /> :
                        e.status === AuditStatus.MANAGER_APPROVED ? <CheckCircle2 size={22} /> :
                          <FileText size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors truncate pr-8">{taskLabel}</h3>
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border shadow-sm ${STATUS_COLORS[e.status]}`}>
                          {e.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed mb-4 max-w-3xl">
                        {e.comment}
                      </p>
                      {e.managerComment && (
                        <div className="mb-4 bg-slate-950/60 p-5 rounded-2xl text-[11px] font-medium text-slate-400 border border-white/5 relative">
                          <div className="absolute top-0 left-6 -translate-y-1/2 bg-slate-900 px-3 py-0.5 font-black text-[8px] text-blue-400 border border-white/10 rounded-full tracking-[0.2em] uppercase">
                            Auditor Decryption
                          </div>
                          {e.managerComment}
                        </div>
                      )}
                      <div className="flex items-center gap-6 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Calendar size={14} className="text-slate-700" /> {e.submissionDate}</span>
                        {e.fileUrl && (
                          <span className="flex items-center gap-2 text-blue-500 cursor-pointer hover:text-blue-400 transition-colors">
                            <FileText size={14} /> Artifact Linked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistSubmission;
