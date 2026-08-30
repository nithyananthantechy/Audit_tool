import React, { useState, useEffect } from 'react';
import { Inbox, Plus, Clock, CheckCircle, XCircle, AlertCircle, FileText, Send, UserCheck } from 'lucide-react';
import { apiClient } from '../apiClient';
import { EvidenceRequest, User } from '../types';

interface EvidenceRequestHubProps {
  user: User;
}

export const EvidenceRequestHub: React.FC<EvidenceRequestHubProps> = ({ user }) => {
  const [requests, setRequests] = useState<EvidenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [controlId, setControlId] = useState('CTRL-AC-001');
  const [department, setDepartment] = useState('HR');
  const [evidenceRequired, setEvidenceRequired] = useState('Employee termination logs & access revocation proofs');
  const [assignedTo, setAssignedTo] = useState('HR Manager');
  const [priority, setPriority] = useState('High');
  const [dueDate, setDueDate] = useState('2026-09-05');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getEvidenceRequests();
      setRequests(res || []);
    } catch (err) {
      console.error('Failed to load evidence requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createEvidenceRequest({
        controlId,
        department,
        evidenceRequired,
        assignedTo,
        priority,
        dueDate
      });
      setShowModal(false);
      loadRequests();
    } catch (err) {
      alert('Failed to create evidence request.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Inbox size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Evidence Request Hub</h1>
            <p className="text-slate-400 text-sm">Targeted auditor evidence request system with department assignments & SLAs</p>
          </div>
        </div>

        {(user.role.includes('Admin') || user.role.includes('Auditor')) && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-2xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            <span>New Evidence Request</span>
          </button>
        )}
      </div>

      {/* Requests Ledger */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Send size={20} className="text-amber-400" />
          <span>Active Evidence Requests ({requests.length})</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Control</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Evidence Required</th>
                <th className="py-3 px-4">Assigned Owner</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-amber-400">{r.requestId}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-300">{r.controlId}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{r.department}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs">{r.evidenceRequired}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">{r.assignedTo}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
                      r.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{r.dueDate}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 font-medium">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Create Evidence Request</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Control ID</label>
                  <input
                    type="text"
                    value={controlId}
                    onChange={(e) => setControlId(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Security">Security</option>
                    <option value="Legal">Legal</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Evidence Required</label>
                <textarea
                  rows={3}
                  required
                  value={evidenceRequired}
                  onChange={(e) => setEvidenceRequired(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Assigned To</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
