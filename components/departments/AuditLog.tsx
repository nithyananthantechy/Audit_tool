import React, { useState, useEffect } from 'react';
import { Shield, Fingerprint, Lock, Search, FileText, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../apiClient';
import { AuditIntegrityResult } from '../../types';

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
  const [verifying, setVerifying] = useState(false);
  const [integrity, setIntegrity] = useState<AuditIntegrityResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogsAndIntegrity = async () => {
    setLoading(true);
    try {
      const data = await api.getData();
      if (data.activity) {
        setLogs(data.activity);
      }
      const integrityResult = await api.getAuditIntegrity();
      setIntegrity(integrityResult);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNow = async () => {
    setVerifying(true);
    try {
      const integrityResult = await api.getAuditIntegrity();
      setIntegrity(integrityResult);
    } catch (e) {
      console.error('Verification error:', e);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLogsAndIntegrity();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      (l.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.hash && l.hash.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            Tamper-Evident Audit Ledger
          </h2>
          <p className="text-slate-400 mt-2 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Cryptographically sealed append-only log with SHA-256 hash chains.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Real-time Chain Verification Badge */}
          {integrity && (
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest ${
                integrity.valid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {integrity.valid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{integrity.valid ? `LEDGER VERIFIED (${integrity.checkedRecords} BLOCKS)` : 'INTEGRITY COMPROMISED'}</span>
            </div>
          )}

          <button
            onClick={handleVerifyNow}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <RefreshCw size={14} className={verifying ? 'animate-spin' : ''} />
            Verify
          </button>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hash or actor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md relative">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-xs uppercase font-black tracking-widest">Validating Cryptographic Ledger Blocks...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-white/10">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4 text-right">Cryptographic Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                          {(log.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{log.userName || 'System'}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{log.department || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-md">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.hash ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                            <Fingerprint className="w-3.5 h-3.5" />
                            {log.hash.substring(0, 16)}...
                          </span>
                          <span className="text-[9px] font-mono text-slate-600">
                            Prev: {log.previous_hash ? log.previous_hash.substring(0, 12) + '...' : 'GENESIS'}
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
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                      <FileText className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                      No audit ledger records found
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
