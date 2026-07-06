import React, { useState } from 'react';
import { User } from '../../types';
import { Building2, Plus, CheckCircle2, XCircle, Search, X } from 'lucide-react';

interface Props {
  user: User;
}

interface RecordType {
  id: string;
  col1: string;
  col2: string;
  col3: string;
  status: 'Completed' | 'Pending';
  date?: string;
}

const AuditHub: React.FC<Props> = ({ user }) => {
  const [records, setRecords] = useState<RecordType[]>([
      { id: '1', col1: 'Q3 Financial Audit', col2: 'Finance', col3: 'Alice Brown', status: 'Pending', date: '2026-09-15' },
      { id: '2', col1: 'ISO 27001 Surveillance', col2: 'IT & Security', col3: 'Bob White', status: 'Completed', date: '2026-06-20' }
    ]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [newRecord, setNewRecord] = useState<Partial<RecordType>>({ status: 'Pending' });

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.col1 || !newRecord.col2 || !newRecord.col3) return;

    setRecords([
      {
        id: Math.random().toString(36).substr(2, 9),
        col1: newRecord.col1,
        col2: newRecord.col2,
        col3: newRecord.col3,
        status: newRecord.status as 'Completed' | 'Pending',
        date: newRecord.status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
      },
      ...records
    ]);
    setShowForm(false);
    setNewRecord({ status: 'Pending' });
  };

  const filteredRecords = records.filter(r => 
    r.col1.toLowerCase().includes(search.toLowerCase()) || 
    r.col2.toLowerCase().includes(search.toLowerCase()) ||
    r.col3.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Audit <span className="text-blue-500">Hub</span></h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Master Compliance Calendar</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
        >
          <Plus size={16} /> New Entry
        </button>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-2xl rounded-[40px] border border-white/[0.08] p-8 min-h-[400px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white">Master Compliance Calendar Records</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white/[0.05] border border-white/[0.05] rounded-2xl text-sm text-white placeholder-white/30 outline-none focus:border-blue-500/50 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-4 px-4 text-[10px] uppercase tracking-wider font-bold text-slate-400">Audit Name</th>
                <th className="py-4 px-4 text-[10px] uppercase tracking-wider font-bold text-slate-400">Target Department</th>
                <th className="py-4 px-4 text-[10px] uppercase tracking-wider font-bold text-slate-400">Lead Auditor</th>
                <th className="py-4 px-4 text-[10px] uppercase tracking-wider font-bold text-slate-400">Status</th>
                <th className="py-4 px-4 text-[10px] uppercase tracking-wider font-bold text-slate-400">Scheduled Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 font-semibold text-white">{record.col1}</td>
                  <td className="py-4 px-4 text-slate-300">{record.col2}</td>
                  <td className="py-4 px-4 font-medium text-slate-300">{record.col3}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit ${
                      record.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {record.status === 'Completed' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {record.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-400">{record.date || '--'}</td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black text-white mb-6">Add New Record</h3>
            
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Audit Name</label>
                <input 
                  type="text" required
                  value={newRecord.col1 || ''}
                  onChange={(e) => setNewRecord({...newRecord, col1: e.target.value})}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Target Department</label>
                <input 
                  type="text" required
                  value={newRecord.col2 || ''}
                  onChange={(e) => setNewRecord({...newRecord, col2: e.target.value})}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Lead Auditor</label>
                <input 
                  type="text" required
                  value={newRecord.col3 || ''}
                  onChange={(e) => setNewRecord({...newRecord, col3: e.target.value})}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Status</label>
                <select 
                  value={newRecord.status}
                  onChange={(e) => setNewRecord({...newRecord, status: e.target.value as 'Completed' | 'Pending'})}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/[0.05] rounded-xl text-white outline-none focus:border-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 hover:bg-blue-500 transition-colors shadow-xl shadow-blue-500/20"
              >
                Save Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditHub;
