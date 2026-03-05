
import React from 'react';
import { User, Evidence, DMAXReport, AuditStatus, Role, ChecklistItem } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { STATUS_COLORS } from '../constants';
import { AlertTriangle, ChevronRight, FileText, CheckCircle2, Clock } from 'lucide-react';

interface DashboardProps {
  user: User;
  evidence: Evidence[];
  dmax: DMAXReport[];
  checklists: ChecklistItem[];
  users: User[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, evidence, dmax, checklists, users }) => {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const hasSubmittedDmax = dmax.some(r => r.userId === user.id && r.month === currentMonth);

  const myEvidence = (user.role === Role.MANAGER || user.role === Role.HR)
    ? evidence.filter(e => e.department === user.department)
    : evidence.filter(e => e.userId === user.id);

  const stats = [
    { label: 'Total Audits', value: myEvidence.length, color: 'bg-blue-600' },
    { label: 'Approved', value: myEvidence.filter(e => e.status === AuditStatus.MANAGER_APPROVED || e.status === AuditStatus.FINAL_AUDIT_COMPLETED).length, color: 'bg-emerald-600' },
    { label: 'Pending Review', value: myEvidence.filter(e => e.status === AuditStatus.SUBMITTED).length, color: 'bg-amber-500' },
    { label: 'Rejected', value: myEvidence.filter(e => e.status === AuditStatus.REJECTED).length, color: 'bg-red-500' },
  ];

  const pieData = [
    { name: 'Approved', value: stats[1].value },
    { name: 'Pending', value: stats[2].value },
    { name: 'Rejected', value: stats[3].value },
  ];
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  // Checklist status: tasks for this user's department
  const myDeptTasks = checklists.filter(t => t.department === user.department);

  // For manager/HR: show all contributors' submission status
  const isManagerView = user.role === Role.MANAGER || user.role === Role.HR || user.role === Role.INTERNAL_AUDITOR || user.role === Role.EXTERNAL_AUDITOR || user.role === Role.SUPER_ADMIN;

  const deptContributors = users.filter(u => u.department === user.department && u.id !== user.id && (u.role === Role.CONTRIBUTOR || u.role === Role.TEAM_LEAD));

  // Build checklist status matrix for current user
  const submittedTaskIds = new Set(
    evidence.filter(e => e.userId === user.id).map(e => e.checklistItemId)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">Welcome, <span className="text-blue-500">{user.name.split(' ')[0]}</span></h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">{user.department} Workspace &bull; {user.role}</p>
        </div>
        {user.role !== Role.EXTERNAL_AUDITOR && user.role !== Role.SUPER_ADMIN && !hasSubmittedDmax && (
          <div className="bg-blue-600/10 backdrop-blur-xl border border-blue-500/20 p-5 rounded-[32px] flex items-center gap-5 shadow-2xl animate-bounce-subtle">
            <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/30">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white uppercase tracking-wider">Compliance Missing: {currentMonth}</p>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Your monthly health report is required for organization auditing.</p>
            </div>
            <button className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">
              Upload Now <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/[0.03] backdrop-blur-2xl p-6 rounded-[32px] border border-white/[0.08] group hover:border-blue-500/30 transition-all hover:-translate-y-1 duration-300">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-white tracking-tighter">{stat.value}</span>
              <div className={`${stat.color} text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                Live
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checklist Status Panel */}
      {myDeptTasks.length > 0 && (
        <div className="bg-white/[0.03] backdrop-blur-2xl p-8 rounded-[40px] border border-white/[0.08] shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Checklist <span className="text-blue-500">Status</span></h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">{user.department} Department Tasks</p>
            </div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full border border-white/5">
              {submittedTaskIds.size}/{myDeptTasks.length} Submitted
            </div>
          </div>

          <div className="space-y-3">
            {myDeptTasks.map(task => {
              const submitted = submittedTaskIds.has(task.id);
              const taskEvidence = evidence.filter(e => e.checklistItemId === task.id && e.userId === user.id);
              const latestStatus = taskEvidence.length > 0 ? taskEvidence[taskEvidence.length - 1].status : null;

              return (
                <div key={task.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${submitted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${submitted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {submitted ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{task.task}</p>
                    {latestStatus && (
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{latestStatus}</p>
                    )}
                  </div>
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${submitted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {submitted ? 'Submitted' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Manager view: show team member status */}
          {isManagerView && deptContributors.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Team Submission Overview</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-3 text-[9px] font-black text-slate-600 uppercase tracking-widest">Member</th>
                      {myDeptTasks.map(t => (
                        <th key={t.id} className="pb-3 px-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center max-w-[80px]">
                          <span className="truncate block" title={t.task}>{t.task.split(' ').slice(0, 2).join(' ')}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {deptContributors.map(member => (
                      <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 text-xs font-bold text-white">{member.name}</td>
                        {myDeptTasks.map(task => {
                          const memberSubmitted = evidence.some(e => e.userId === member.id && e.checklistItemId === task.id);
                          return (
                            <td key={task.id} className="py-3 px-2 text-center">
                              {memberSubmitted
                                ? <CheckCircle2 size={16} className="text-emerald-400 mx-auto" />
                                : <Clock size={16} className="text-amber-400/50 mx-auto" />}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-2xl p-8 rounded-[40px] border border-white/[0.08] overflow-hidden">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Compliance Activity Stream</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-4 font-black text-slate-500 text-[9px] uppercase tracking-widest">Audit Task</th>
                  <th className="pb-4 font-black text-slate-500 text-[9px] uppercase tracking-widest text-center">Date</th>
                  <th className="pb-4 font-black text-slate-500 text-[9px] uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/5">
                {myEvidence.slice(-5).reverse().map((e) => {
                  const taskLabel = checklists.find(t => t.id === e.checklistItemId)?.task || e.checklistItemId.toUpperCase();
                  return (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-5">
                        <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">{taskLabel}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[250px] mt-1 font-medium italic opacity-60">"{e.comment}"</p>
                      </td>
                      <td className="py-5 text-[10px] font-black text-slate-500 text-center uppercase tracking-tighter">{e.submissionDate}</td>
                      <td className="py-5 text-right">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${STATUS_COLORS[e.status]}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {myEvidence.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-20 text-center text-slate-600">
                      <div className="bg-white/5 w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <FileText className="text-slate-500" size={28} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest">No submissions yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-2xl p-8 rounded-[40px] border border-white/[0.08] flex flex-col items-center">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] self-start mb-8">Compliance Matrix</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', color: '#fff' }} itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 w-full text-center">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Live: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Dashboard;
