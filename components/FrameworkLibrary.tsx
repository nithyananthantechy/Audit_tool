import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, CheckCircle2, ShieldCheck, Search, FileCode, Tag } from 'lucide-react';
import { apiClient } from '../apiClient';
import { FrameworkRecord, RequirementRecord, User } from '../types';

interface FrameworkLibraryProps {
  user: User;
}

export const FrameworkLibrary: React.FC<FrameworkLibraryProps> = ({ user }) => {
  const [frameworks, setFrameworks] = useState<FrameworkRecord[]>([]);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [selectedFw, setSelectedFw] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fwRes, reqRes] = await Promise.all([
        apiClient.getFrameworks(),
        apiClient.getRequirements()
      ]);
      setFrameworks(fwRes || []);
      setRequirements(reqRes || []);
      if (fwRes && fwRes.length > 0) {
        setSelectedFw(fwRes[0].frameworkId);
      }
    } catch (err) {
      console.error('Failed to load framework library:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReqs = requirements.filter(r => {
    const matchesFw = !selectedFw || r.frameworkId === selectedFw;
    const matchesSearch = !search || r.clause.toLowerCase().includes(search.toLowerCase()) || r.title.toLowerCase().includes(search.toLowerCase());
    return matchesFw && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Compliance Framework Library</h1>
            <p className="text-slate-400 text-sm">Database-driven multi-framework regulatory clause repository and control mappings</p>
          </div>
        </div>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {frameworks.map(fw => {
          const isSelected = selectedFw === fw.frameworkId;
          const reqCount = requirements.filter(r => r.frameworkId === fw.frameworkId).length;
          return (
            <div
              key={fw.id}
              onClick={() => setSelectedFw(fw.frameworkId)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-purple-600/15 border-purple-500/50 shadow-lg text-white'
                  : 'bg-slate-900/40 border-white/5 hover:border-white/20 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-lg">
                  {fw.version}
                </span>
                <span className="text-xs text-slate-400 font-medium">{reqCount} Clauses</span>
              </div>
              <h3 className="font-bold text-white text-base mb-1">{fw.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{fw.description}</p>
            </div>
          );
        })}
      </div>

      {/* Search & Clause Ledger */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers size={20} className="text-purple-400" />
            <span>Clause & Requirement Ledger</span>
          </h2>

          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clauses or titles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Clause</th>
                <th className="py-3 px-4">Requirement Title</th>
                <th className="py-3 px-4">Framework</th>
                <th className="py-3 px-4">Applicability</th>
                <th className="py-3 px-4">Control Objective</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredReqs.map(req => (
                <tr key={req.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-purple-400">{req.clause}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{req.title}</td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{req.frameworkId}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      {req.applicability || 'Applicable'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">{req.description || req.guidance || 'Standard governance objective.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
