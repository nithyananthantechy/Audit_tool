import React, { useState, useEffect } from 'react';
import { Shield, Fingerprint, Lock, Search, FileText } from 'lucide-react';
import { api } from '../../apiClient';

interface AuditEvent {
  id: string;
  userId: string;
  userName: string;
  department: string;
  action: string;
  description: string;
  timestamp: string;
  hash: string;
  previous_hash: string;
}

const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.getData();
        if (data.activity) {
          setLogs(data.activity);
        }
      } catch (e) {
        console.error("Failed to load audit logs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    (l.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.hash && l.hash.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            Tamper-Evident Audit Ledger
          </h2>
          <p className="text-slate-400 mt-2 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Cryptographically sealed append-only log of all system activities.
          </p>
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hash, user, action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md relative">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            Loading ledger blocks...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-300 text-xs uppercase tracking-widest border-b border-white/10">
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">Actor</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                  <th className="px-6 py-4 font-semibold text-right">Cryptographic Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                          {(log.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{log.userName || 'Unknown User'}</p>
                          <p className="text-xs text-slate-500">{log.department || 'Unknown Dept'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 shadow-inner">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.hash ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                            <Fingerprint className="w-3 h-3" />
                            {log.hash.substring(0, 16)}...
                          </span>
                          <span className="text-[9px] font-mono text-slate-600">
                            Prev: {log.previous_hash ? log.previous_hash.substring(0, 10) + '...' : 'GENESIS'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 font-mono">Unverified (Legacy)</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                      No audit logs found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
