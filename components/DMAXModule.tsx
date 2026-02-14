
import React, { useState } from 'react';
import { User, DMAXReport, AuditStatus, Department, Role } from '../types';
import { STATUS_COLORS } from '../constants';
import { FilePlus2, Search, Calendar, CheckCircle2, Loader2, FileText, ChevronRight, Upload, X, AlertCircle, Download } from 'lucide-react';
import { api } from '../api';

interface DMAXProps {
  user: User;
  reports: DMAXReport[];
  setReports: React.Dispatch<React.SetStateAction<DMAXReport[]>>;
}

const MAX_DMAX_LENGTH = 2000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const DMAXModule: React.FC<DMAXProps> = ({ user, reports, setReports }) => {
  const [month, setMonth] = useState('January');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Invalid file type. Please upload PDF, Word, or Excel documents.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('File size exceeds 10MB limit.');
        return;
      }

      setFileName(file.name);
      setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');
      setFileUrl(`file://${file.name}`);
    }
  };

  const removeFile = () => {
    setFileName('');
    setFileSize('');
    setFileUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Summary of accomplishments is required.');
      return;
    }

    if (!fileUrl) {
      setError('A DMAX report document is mandatory.');
      return;
    }

    // Check for duplicate submission for the same month/year
    const duplicate = reports.find(r => r.userId === user.id && r.month === month && r.year === 2024);
    if (duplicate && duplicate.status !== AuditStatus.REJECTED) {
      setError(`A DMAX report for ${month} 2024 has already been submitted.`);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newReport: DMAXReport = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        userName: user.name,
        department: user.department,
        month,
        year: 2024,
        content,
        status: AuditStatus.SUBMITTED,
        submissionDate: new Date().toISOString().split('T')[0],
        fileName,
        fileUrl,
        fileSize
      };

      // Optimistic update
      setReports(prev => [...prev, newReport]);

      api.addDmax(newReport).then(() => {
        setContent('');
        setFileName('');
        setFileSize('');
        setFileUrl('');
        setIsSubmitting(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      }).catch(err => {
        console.error(err);
        setIsSubmitting(false);
        setError("Failed to create report on server");
      });
    }, 1500);
  };

  const myReports = reports.filter(r => r.userId === user.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">DMAX <span className="text-blue-500">Reports</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Monthly Accomplishment Protocol</p>
        </div>
        <div className="flex items-center gap-4">
          {showSuccess && (
            <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-8">
              <CheckCircle2 size={16} />
              System Updated
            </div>
          )}
          <div className="bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 flex items-center gap-3 px-6 py-3">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Node</span>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white/[0.03] backdrop-blur-2xl p-10 rounded-[40px] border border-white/[0.08] shadow-2xl sticky top-24 overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/5 blur-[60px] rounded-full"></div>

            <h2 className="text-xl font-black text-white mb-8 flex items-center gap-4 relative z-10">
              <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30">
                <FilePlus2 className="text-blue-400" size={20} />
              </div>
              New Entry
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Reporting Cycle</label>
                <div className="relative">
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full h-14 px-6 bg-slate-950 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none appearance-none"
                  >
                    {months.map(m => <option key={m} value={m} className="bg-slate-900">{m} 2024</option>)}
                  </select>
                  <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" size={18} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Executive Summary</label>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${content.length > MAX_DMAX_LENGTH * 0.9 ? 'text-red-500' : 'text-slate-700'}`}>
                    {content.length} / {MAX_DMAX_LENGTH}
                  </span>
                </div>
                <textarea
                  value={content}
                  maxLength={MAX_DMAX_LENGTH}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-3xl p-6 text-sm font-medium text-white placeholder:text-slate-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none min-h-[160px] leading-relaxed"
                  placeholder="Key accomplishments..."
                  required
                ></textarea>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">
                  Report Artifact <span className="text-blue-500">*</span>
                </label>
                {!fileName ? (
                  <div className="relative group">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      id="dmax-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <div className="flex flex-col items-center justify-center w-full h-32 bg-slate-950/40 border-2 border-dashed border-white/5 rounded-3xl px-4 text-center group-hover:border-blue-500/50 group-hover:bg-blue-600/5 transition-all">
                      <Upload size={24} className="text-slate-700 group-hover:text-blue-400 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-400">Push Document</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between h-16 bg-blue-600/10 border border-blue-500/30 rounded-2xl px-6 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <FileText size={18} className="text-blue-400 flex-shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-black text-white truncate">{fileName}</span>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{fileSize}</span>
                      </div>
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

              {error && (
                <div className="flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !content.trim() || !fileUrl}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/30 disabled:opacity-30 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Commit Report'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[40px] border border-white/[0.08] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h2 className="text-xl font-black text-white tracking-tight">Sync <span className="text-blue-500">History</span></h2>
              <div className="flex gap-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Enterprise Node 2024
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Cycle</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Artifact</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Status</th>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myReports.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="bg-white/5 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-white/5">
                          <FileText className="text-slate-700" size={36} />
                        </div>
                        <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em]">No history found</p>
                      </td>
                    </tr>
                  ) : (
                    [...myReports].reverse().map(report => (
                      <tr key={report.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg">
                              <Calendar size={18} />
                            </div>
                            <div>
                              <span className="font-black text-white block text-sm group-hover:text-blue-400 transition-colors">{report.month}</span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 inline-block">{report.year}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3 text-slate-400">
                            <FileText size={16} className="text-slate-600" />
                            <span className="text-xs font-bold truncate max-w-[120px]">{report.fileName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border shadow-sm ${STATUS_COLORS[report.status]}`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-4">
                            <button className="text-slate-600 hover:text-white p-2 bg-white/5 rounded-xl transition-all border border-white/5">
                              <Download size={16} />
                            </button>
                            <button className="text-blue-500 hover:text-white text-[9px] font-black uppercase tracking-widest bg-blue-600/10 hover:bg-blue-600 px-4 py-2 rounded-xl border border-blue-500/20 transition-all">
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DMAXModule;
