import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, AlertTriangle, Layers, Plus, FileSearch, ShieldAlert } from 'lucide-react';
import { apiClient } from '../apiClient';
import { ControlTest, User } from '../types';

interface ControlTestingWorkspaceProps {
  user: User;
}

export const ControlTestingWorkspace: React.FC<ControlTestingWorkspaceProps> = ({ user }) => {
  const [tests, setTests] = useState<ControlTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [controlId, setControlId] = useState('A.9.2.1');
  const [testProcedure, setTestProcedure] = useState('Inspected last 5 employee termination records to verify access revocation within SLA.');
  const [populationSize, setPopulationSize] = useState(24);
  const [sampleSize, setSampleSize] = useState(5);
  const [samplingMethod, setSamplingMethod] = useState('Random');
  const [observation, setObservation] = useState('1 out of 5 sampled employee termination records showed a 48-hour delay in GitHub account revocation.');
  const [result, setResult] = useState<'Pass' | 'Partial Pass' | 'Fail'>('Partial Pass');

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getControlTests();
      setTests(res || []);
    } catch (err) {
      console.error('Failed to load control tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.submitControlTest({
        controlId,
        testProcedure,
        populationSize,
        sampleSize,
        samplingMethod,
        observation,
        result
      });
      setShowModal(false);
      loadTests();
    } catch (err) {
      alert('Failed to record control test.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Control Testing & Sampling Engine</h1>
            <p className="text-slate-400 text-sm">Formal auditor control test execution, population sampling & observation logging</p>
          </div>
        </div>

        {(user.role.includes('Admin') || user.role.includes('Auditor')) && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            <span>Record Control Test</span>
          </button>
        )}
      </div>

      {/* Tests Ledger */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <FileSearch size={20} className="text-emerald-400" />
          <span>Executed Audit Control Tests ({tests.length})</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Test ID</th>
                <th className="py-3 px-4">Control ID</th>
                <th className="py-3 px-4">Tester</th>
                <th className="py-3 px-4">Sampling Method</th>
                <th className="py-3 px-4">Population / Sample</th>
                <th className="py-3 px-4">Observation</th>
                <th className="py-3 px-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {tests.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-400">{t.testId}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-white">{t.controlId}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-300">{t.tester}</td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-400">{t.samplingMethod}</td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-300">{t.populationSize} / {t.sampleSize} items</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs">{t.observation || 'Compliant with control requirement.'}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
                      t.result === 'Pass' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      t.result === 'Partial Pass' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {t.result}
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
            <h2 className="text-xl font-bold text-white">Execute Control Test</h2>
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Control ID</label>
                  <input
                    type="text"
                    value={controlId}
                    onChange={(e) => setControlId(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Test Result</label>
                  <select
                    value={result}
                    onChange={(e) => setResult(e.target.value as any)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="Pass">Pass</option>
                    <option value="Partial Pass">Partial Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Test Procedure</label>
                <textarea
                  rows={2}
                  value={testProcedure}
                  onChange={(e) => setTestProcedure(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Population</label>
                  <input
                    type="number"
                    value={populationSize}
                    onChange={(e) => setPopulationSize(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Sample Size</label>
                  <input
                    type="number"
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Method</label>
                  <select
                    value={samplingMethod}
                    onChange={(e) => setSamplingMethod(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Random">Random</option>
                    <option value="Risk-Based">Risk-Based</option>
                    <option value="Targeted">Targeted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Auditor Observation</label>
                <textarea
                  rows={3}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20"
                >
                  Record Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
