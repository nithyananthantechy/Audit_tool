import React, { useState, useEffect } from 'react';
import { Server, Building, FileText, AlertTriangle, ShieldCheck, Plus, CheckCircle, Lock } from 'lucide-react';
import { apiClient } from '../apiClient';
import { AssetRecord, VendorRecord, PolicyRecord, IncidentRecord, User } from '../types';

interface AssetVendorPolicyHubProps {
  user: User;
}

export const AssetVendorPolicyHub: React.FC<AssetVendorPolicyHubProps> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<'assets' | 'vendors' | 'policies' | 'incidents'>('assets');
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [astRes, vndRes, polRes, incRes] = await Promise.all([
        apiClient.getAssets(),
        apiClient.getVendors(),
        apiClient.getPolicies(),
        apiClient.getIncidents()
      ]);
      setAssets(astRes || []);
      setVendors(vndRes || []);
      setPolicies(polRes || []);
      setIncidents(incRes || []);
    } catch (err) {
      console.error('Failed to load asset & vendor risk data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <Server size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Assets, Vendors & Policy Governance</h1>
            <p className="text-slate-400 text-sm">Audit-oriented asset inventory, third-party vendor risk assessments, policy register & incident response</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-white/10 max-w-xl">
        <button
          onClick={() => setActiveSubTab('assets')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'assets' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Assets ({assets.length})
        </button>
        <button
          onClick={() => setActiveSubTab('vendors')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'vendors' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Vendors ({vendors.length})
        </button>
        <button
          onClick={() => setActiveSubTab('policies')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'policies' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Policies ({policies.length})
        </button>
        <button
          onClick={() => setActiveSubTab('incidents')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'incidents' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Incidents ({incidents.length})
        </button>
      </div>

      {/* Sub Tab Contents */}
      {activeSubTab === 'assets' && (
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Server size={20} className="text-indigo-400" />
            <span>Audit Asset Inventory</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Asset ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Criticality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-400">{a.assetId}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{a.name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{a.category}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">{a.department}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">{a.owner}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-amber-300">{a.dataClassification}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                        {a.criticality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'vendors' && (
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Building size={20} className="text-indigo-400" />
            <span>Third-Party Vendor Risk Ledger</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Vendor ID</th>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">Service Provided</th>
                  <th className="py-3 px-4">Data Access Level</th>
                  <th className="py-3 px-4">DPA Signed</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-400">{v.vendorId}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{v.name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{v.serviceProvided}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-cyan-300">{v.dataAccess}</td>
                    <td className="py-3.5 px-4">
                      {v.dpaSigned ? (
                        <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Yes (Active DPA)</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20">No DPA</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-amber-400">{v.riskLevel}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 font-medium">{v.securityAssessmentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'policies' && (
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <FileText size={20} className="text-indigo-400" />
            <span>Policy Management Register</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Policy ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {policies.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-400">{p.policyId}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{p.title}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{p.category}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-purple-300">v{p.version}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">{p.owner}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{p.effectiveDate}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'incidents' && (
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-indigo-400" />
            <span>Security & Compliance Incidents</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Detected At</th>
                  <th className="py-3 px-4">Reported By</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-400">{inc.incidentId}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{inc.title}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{inc.type}</td>
                    <td className="py-3.5 px-4 font-bold text-red-400 text-xs">{inc.severity}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{inc.detectedAt.slice(0, 10)}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">{inc.reportedBy}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 font-medium">
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
