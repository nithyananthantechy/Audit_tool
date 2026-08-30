import React, { useState, useEffect } from 'react';
import { Lock, Database, UserCheck, ShieldCheck, Plus, FileText, User } from 'lucide-react';
import { apiClient } from '../apiClient';
import { DataAssetRecord, User as UserType } from '../types';

interface PrivacyDPDPHubProps {
  user: UserType;
}

export const PrivacyDPDPHub: React.FC<PrivacyDPDPHubProps> = ({ user }) => {
  const [inventory, setInventory] = useState<DataAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [category, setCategory] = useState('Employee Personal Data');
  const [personalDataTypes, setPersonalDataTypes] = useState('Name, Contact Details, Bank Account, Aadhaar Number');
  const [dataPrincipal, setDataPrincipal] = useState('Employees & Contractors');
  const [purpose, setPurpose] = useState('Payroll Processing & Tax Deductions');
  const [storageLocation, setStorageLocation] = useState('PostgreSQL DB (AWS ap-south-1)');
  const [retentionPeriod, setRetentionPeriod] = useState('7 Years post-employment');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getDPDPInventory();
      setInventory(res || []);
    } catch (err) {
      console.error('Failed to load DPDP inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDPDPRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createDPDPRecord({
        category,
        personalDataTypes,
        dataPrincipal,
        purpose,
        storageLocation,
        retentionPeriod
      });
      setShowModal(false);
      loadInventory();
    } catch (err) {
      alert('Failed to add DPDP record.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20">
            <Lock size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">DPDP Privacy & Data Principal Hub</h1>
            <p className="text-slate-400 text-sm">Digital Personal Data Protection Act 2023 inventory & processing activities register</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-2xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={18} />
          <span>Register Personal Data Asset</span>
        </button>
      </div>

      {/* Statutory DPDP Compliance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-400 uppercase">
            <span>Sec 8(5) Security Safeguards</span>
            <ShieldCheck size={16} />
          </div>
          <p className="text-2xl font-extrabold text-white">AES-256 Enforced</p>
          <p className="text-xs text-slate-400">Restricted PII encryption in transit & at rest</p>
        </div>

        <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase">
            <span>Sec 8(9) DPO Publication</span>
            <UserCheck size={16} />
          </div>
          <p className="text-2xl font-extrabold text-white">Published & Active</p>
          <p className="text-xs text-slate-400">DPO: dpo@nskgroups.com | Response SLA: 48h</p>
        </div>

        <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase">
            <span>Registered PII Categories</span>
            <Database size={16} />
          </div>
          <p className="text-2xl font-extrabold text-white">{inventory.length} Categories</p>
          <p className="text-xs text-slate-400">Fully mapped across processing activities</p>
        </div>
      </div>

      {/* DPDP Ledger */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Database size={20} className="text-cyan-400" />
          <span>Personal Data Processing Inventory ({inventory.length})</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Data Principal</th>
                <th className="py-3 px-4">Personal Data Types</th>
                <th className="py-3 px-4">Processing Purpose</th>
                <th className="py-3 px-4">Storage Location</th>
                <th className="py-3 px-4">Retention SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {inventory.map((i) => (
                <tr key={i.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">{i.category}</td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-cyan-300">{i.dataPrincipal}</td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-300 max-w-xs">{i.personalDataTypes}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-300">{i.purpose}</td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{i.storageLocation}</td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-400">{i.retentionPeriod}</td>
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
            <h2 className="text-xl font-bold text-white">Register Personal Data Asset</h2>
            <form onSubmit={handleAddDPDPRecord} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Category Name</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Personal Data Types</label>
                <input
                  type="text"
                  required
                  value={personalDataTypes}
                  onChange={(e) => setPersonalDataTypes(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Data Principal</label>
                  <input
                    type="text"
                    value={dataPrincipal}
                    onChange={(e) => setDataPrincipal(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Retention Period</label>
                  <input
                    type="text"
                    value={retentionPeriod}
                    onChange={(e) => setRetentionPeriod(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Processing Purpose</label>
                <textarea
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500"
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
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20"
                >
                  Register Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
