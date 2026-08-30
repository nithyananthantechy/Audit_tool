import React, { useState, useEffect } from 'react';
import { Organization } from '../types';
import { api } from '../apiClient';
import {
  Building2, ShieldCheck, Clock, Users, Plus, RefreshCw, KeyRound,
  AlertTriangle, CheckCircle2, Search, Filter, Calendar, Mail, UserCheck,
  ChevronRight, Lock, AlertCircle, X, ShieldAlert, Sparkles, Pencil, Trash2
} from 'lucide-react';

interface OrganizationManagerProps {
  onActivityLog?: (action: string, description: string) => void;
}

export const OrganizationManager: React.FC<OrganizationManagerProps> = ({ onActivityLog }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Expiring' | 'Expired' | 'Suspended'>('All');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    contactName: '',
    contactEmail: '',
    plan: 'Enterprise',
    maxUsers: 25,
    durationMonths: 12,
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  // Renew Form State
  const [renewForm, setRenewForm] = useState({
    durationMonths: 12,
    newMaxUsers: 25,
    newEndDate: '',
    status: 'Active' as 'Active' | 'Suspended' | 'Expired'
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    contactName: '',
    contactEmail: '',
    plan: 'Enterprise',
    maxUsers: 25,
    endDate: '',
    status: 'Active' as 'Active' | 'Suspended' | 'Expired'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string; orgName: string } | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await api.getOrganizations();
      if (res.success && res.organizations) {
        setOrganizations(res.organizations);
      }
    } catch (err: any) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const [submitting, setSubmitting] = useState(false);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);
    try {
      const res = await api.createOrganization(createForm);
      if (res.success) {
        setFormSuccess(res.message);
        setCreatedCredentials({
          email: res.orgAdmin?.email || createForm.contactEmail,
          pass: res.orgAdmin?.initialPassword || createForm.adminPassword,
          orgName: createForm.name
        });
        fetchOrganizations();
        if (onActivityLog) {
          onActivityLog('SYSTEM', `Provisioned new client organization '${createForm.name}' with ${createForm.maxUsers} seats.`);
        }
      }
    } catch (err: any) {
      console.error('Create Org Error:', err);
      setFormError(err.message || 'Failed to create organization. Please ensure your Super Admin session is active.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setFormError('');
    try {
      const res = await api.renewLicense(selectedOrg.id, {
        extensionMonths: renewForm.durationMonths,
        newMaxUsers: renewForm.newMaxUsers,
        newEndDate: renewForm.newEndDate || undefined
      });

      if (res.success) {
        setIsRenewModalOpen(false);
        fetchOrganizations();
        if (onActivityLog) {
          onActivityLog('SYSTEM', `Renewed license subscription for organization '${selectedOrg.name}'.`);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to renew organization license');
    }
  };

  const openEditModal = (org: Organization) => {
    setSelectedOrg(org);
    setEditForm({
      name: org.name || '',
      contactName: org.contactName || '',
      contactEmail: org.contactEmail || '',
      plan: org.plan || 'Enterprise',
      maxUsers: org.maxUsers || 25,
      endDate: org.endDate ? org.endDate.substring(0, 10) : '',
      status: org.status as any || 'Active'
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setFormError('');
    try {
      const res = await api.updateOrganization(selectedOrg.id, editForm);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchOrganizations();
        if (onActivityLog) {
          onActivityLog('SYSTEM', `Updated organization details for '${editForm.name}'.`);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update organization');
    }
  };

  const openDeleteModal = (org: Organization) => {
    if (org.id === 'org-nitechspark' || org.id === 'org-niutechspark' || org.code === 'nitechspark' || org.code === 'niutechspark') {
      alert('The NitechSpark Platform Owner organization cannot be deleted.');
      return;
    }
    setSelectedOrg(org);
    setFormError('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteOrg = async () => {
    if (!selectedOrg) return;
    setFormError('');
    try {
      const res = await api.deleteOrganization(selectedOrg.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        fetchOrganizations();
        if (onActivityLog) {
          onActivityLog('SYSTEM', `Deleted client organization '${selectedOrg.name}'.`);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete organization');
    }
  };

  const handleToggleStatus = async (org: Organization, newStatus: 'Active' | 'Suspended') => {
    try {
      await api.updateOrganization(org.id, { status: newStatus });
      fetchOrganizations();
      if (onActivityLog) {
        onActivityLog('STATUS_CHANGE', `Updated status for '${org.name}' to ${newStatus}.`);
      }
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const openRenewModal = (org: Organization) => {
    setSelectedOrg(org);
    setRenewForm({
      durationMonths: 12,
      newMaxUsers: org.maxUsers,
      newEndDate: org.endDate ? org.endDate.substring(0, 10) : '',
      status: org.status as any
    });
    setFormError('');
    setIsRenewModalOpen(true);
  };

  // Metrics computation
  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter(o => o.status === 'Active' && (o.daysRemaining === undefined || o.daysRemaining > 0)).length;
  const expiringOrgs = organizations.filter(o => o.isExpiringSoon || (o.daysRemaining !== undefined && o.daysRemaining <= 10 && o.daysRemaining >= 0));
  const totalAllocatedSeats = organizations.reduce((acc, o) => acc + (o.maxUsers || 0), 0);

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = (org.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (org.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (org.contactEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'Active') return matchesSearch && org.status === 'Active' && !org.isExpiringSoon;
    if (statusFilter === 'Expiring') return matchesSearch && (org.isExpiringSoon || (org.daysRemaining !== undefined && org.daysRemaining <= 10 && org.daysRemaining >= 0));
    if (statusFilter === 'Expired') return matchesSearch && (org.status === 'Expired' || (org.daysRemaining !== undefined && org.daysRemaining <= 0));
    if (statusFilter === 'Suspended') return matchesSearch && org.status === 'Suspended';
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 p-8 rounded-3xl border border-blue-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-black uppercase tracking-wider border border-blue-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> NitechSpark SaaS Engine
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            Client Organizations & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">License Subscriptions</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Platform Holder Hub to provision client tenants, enforce validity periods, assign user seat limits, and manage enterprise license renewals.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => {
              setFormError('');
              setFormSuccess('');
              setCreatedCredentials(null);
              setCreateForm({
                name: '',
                code: '',
                contactName: '',
                contactEmail: '',
                plan: 'Enterprise',
                maxUsers: 25,
                durationMonths: 12,
                adminName: '',
                adminEmail: '',
                adminPassword: ''
              });
              setIsCreateModalOpen(true);
            }}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Provision New Client
          </button>
          <button
            onClick={fetchOrganizations}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all border border-slate-700"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expiry Warning Notice Banner (If any client license is expiring soon <= 10 days) */}
      {expiringOrgs.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="text-amber-200 font-bold text-sm">
                ⚠️ License Expiration Warning ({expiringOrgs.length} Client{expiringOrgs.length > 1 ? 's' : ''} Expiring Soon)
              </h4>
              <p className="text-amber-300/80 text-xs mt-0.5">
                The following client licenses will expire in less than 10 days: {expiringOrgs.map(o => `${o.name} (${o.daysRemaining} days left)`).join(', ')}. Contact client stakeholders to initiate license renewal.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('Expiring')}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-500/40 whitespace-nowrap"
          >
            View Expiring Orgs
          </button>
        </div>
      )}

      {/* SaaS Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Clients</span>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{totalOrgs}</div>
          <p className="text-[11px] text-slate-400 mt-1">Active multi-tenant client accounts</p>
        </div>

        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Subscriptions</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">{activeOrgs}</div>
          <p className="text-[11px] text-slate-400 mt-1">Licenses in good standing</p>
        </div>

        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Expiring (&le; 10 Days)</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{expiringOrgs.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Requiring renewal attention</p>
        </div>

        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Licensed User Seats</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-400">{totalAllocatedSeats}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total seats allocated across plans</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, slug, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(['All', 'Active', 'Expiring', 'Expired', 'Suspended'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Organizations Directory Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                <th className="py-4 px-6">Company / Code</th>
                <th className="py-4 px-6">Contact Details</th>
                <th className="py-4 px-6">Plan Tier</th>
                <th className="py-4 px-6">User Seats Usage</th>
                <th className="py-4 px-6">License Period / Expiry</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading client organizations dataset...
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    No client organizations match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map(org => {
                  const isExpiring = org.isExpiringSoon || (org.daysRemaining !== undefined && org.daysRemaining <= 10 && org.daysRemaining >= 0);
                  const isExpired = org.status === 'Expired' || (org.daysRemaining !== undefined && org.daysRemaining <= 0);

                  return (
                    <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm">
                            {org.name ? org.name.charAt(0).toUpperCase() : 'O'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{org.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">slug: {org.code}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-slate-200 font-medium">{org.contactName || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" /> {org.contactEmail}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg font-bold text-[11px] border border-indigo-500/20">
                          {org.plan}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{org.activeUsersCount || 1}</span>
                          <span className="text-slate-500">/</span>
                          <span className="font-bold text-slate-400">{org.maxUsers} seats</span>
                        </div>
                        <div className="w-24 bg-slate-950 rounded-full h-1.5 mt-1.5 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              ((org.activeUsersCount || 1) / org.maxUsers) >= 1
                                ? 'bg-rose-500'
                                : ((org.activeUsersCount || 1) / org.maxUsers) > 0.8
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(10, ((org.activeUsersCount || 1) / org.maxUsers) * 100))}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-slate-300 font-medium">
                          {org.endDate ? org.endDate.substring(0, 10) : 'Permanent'}
                        </div>
                        <div className="text-[11px] mt-0.5 font-bold">
                          {isExpired ? (
                            <span className="text-rose-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Expired ({org.daysRemaining || 0}d ago)
                            </span>
                          ) : isExpiring ? (
                            <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Expiring in {org.daysRemaining} days!
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Valid ({org.daysRemaining || '365+'} days left)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          org.status === 'Active' && !isExpired
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : org.status === 'Suspended'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isExpired ? 'Expired' : org.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(org)}
                            className="p-2 bg-slate-800 hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 rounded-xl text-xs transition-all border border-slate-700"
                            title="Edit Organization Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Renew License Button */}
                          <button
                            onClick={() => openRenewModal(org)}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-xl text-xs font-bold border border-blue-500/30 transition-all flex items-center gap-1.5"
                            title="Renew or extend license subscription"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Renew License
                          </button>

                          {/* Protected Status for 1st Platform Organization (NitechSpark) */}
                          {org.id === 'org-nitechspark' || org.id === 'org-niutechspark' || org.code === 'nitechspark' || org.code === 'niutechspark' ? (
                            <span className="px-2.5 py-1.5 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-500/20 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Platform Holder
                            </span>
                          ) : (
                            <>
                              {org.status === 'Active' ? (
                                <button
                                  onClick={() => handleToggleStatus(org, 'Suspended')}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl text-xs transition-all border border-slate-700"
                                  title="Suspend Tenant"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(org, 'Active')}
                                  className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all border border-emerald-500/30"
                                  title="Reactivate Tenant"
                                >
                                  Activate
                                </button>
                              )}

                              {/* Delete / Remove Button */}
                              <button
                                onClick={() => openDeleteModal(org)}
                                className="p-2 bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-xl text-xs transition-all border border-slate-700"
                                title="Delete Client Organization"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Client Organization Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 relative my-8">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">NitechSpark SaaS Onboarding</span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-2">Provision New Client & License</h2>
              <p className="text-slate-400 text-xs">Set up a new client organization, valid subscription period, user seats, and initial Org Admin account.</p>
            </div>

            {formError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            {formSuccess && createdCredentials ? (
              <div className="space-y-6 bg-emerald-950/40 border border-emerald-500/30 p-6 rounded-2xl">
                <div className="flex items-center gap-3 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-6 h-6" /> Organization Provisioned Successfully!
                </div>
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl text-xs font-mono border border-slate-800">
                  <div className="text-slate-400 uppercase font-sans font-bold text-[10px] tracking-wider mb-1">Org Admin Initial Credentials ({createdCredentials.orgName})</div>
                  <div><span className="text-slate-500">Admin Email:</span> <span className="text-emerald-300 font-bold">{createdCredentials.email}</span></div>
                  <div><span className="text-slate-500">Temporary Password:</span> <span className="text-blue-400 font-bold">{createdCredentials.pass}</span></div>
                </div>
                <p className="text-slate-400 text-xs">Provide these credentials to the client's Org Admin to allow them to access their dedicated tenant.</p>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreatedCredentials(null);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateOrg} className="space-y-6">
                {/* Company Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" /> 1. Client Company Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Corporation"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Company Slug / Code</label>
                      <input
                        type="text"
                        placeholder="e.g. acme (auto-generated if empty)"
                        value={createForm.code}
                        onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                        className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Contact Person Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={createForm.contactName}
                        onChange={(e) => setCreateForm({ ...createForm, contactName: e.target.value })}
                        className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Contact / Billing Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. admin@acme.com"
                        value={createForm.contactEmail}
                        onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                        className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription & Licensing Config */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> 2. Subscription & License Configuration
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Plan Tier</label>
                      <select
                        value={createForm.plan}
                        onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                        className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Starter">Starter Plan</option>
                        <option value="Professional">Professional Plan</option>
                        <option value="Enterprise">Enterprise Plan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Validity Duration</label>
                      <select
                        value={createForm.durationMonths}
                        onChange={(e) => setCreateForm({ ...createForm, durationMonths: parseInt(e.target.value, 10) })}
                        className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                      >
                        <option value={1}>1 Month (Trial/Short)</option>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months (1 Year)</option>
                        <option value={24}>24 Months (2 Years)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">User Seats Limit *</label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={createForm.maxUsers}
                        onChange={(e) => setCreateForm({ ...createForm, maxUsers: parseInt(e.target.value, 10) || 1 })}
                        className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Org Admin Account Provisioning */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-purple-400" /> 3. Provision Initial Org Admin Account
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Org Admin Email</label>
                      <input
                        type="email"
                        placeholder="Leave empty to use Contact Email"
                        value={createForm.adminEmail}
                        onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
                        className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Initial Password</label>
                      <input
                        type="password"
                        placeholder="Auto-generated if empty"
                        value={createForm.adminPassword}
                        onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
                        className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-3 text-slate-400 hover:text-white font-bold text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center gap-2"
                  >
                    {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Provisioning License...' : 'Create Organization & Activate License'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Renew / Extend License Subscription Modal */}
      {isRenewModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIsRenewModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">License Renewal</span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-2">Renew Subscription: {selectedOrg.name}</h2>
              <p className="text-slate-400 text-xs">Extend license validity period and adjust maximum user seat allocations.</p>
            </div>

            {formError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            <form onSubmit={handleRenewLicense} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Extension Period</label>
                <select
                  value={renewForm.durationMonths}
                  onChange={(e) => setRenewForm({ ...renewForm, durationMonths: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value={1}>+1 Month Extension</option>
                  <option value={3}>+3 Months Extension</option>
                  <option value={6}>+6 Months Extension</option>
                  <option value={12}>+12 Months (1 Year Extension)</option>
                  <option value={24}>+24 Months (2 Years Extension)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">User Seats Count</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={renewForm.newMaxUsers}
                  onChange={(e) => setRenewForm({ ...renewForm, newMaxUsers: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">Currently used: {selectedOrg.activeUsersCount || 1} seats.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Or Specific End Date (Optional)</label>
                <input
                  type="date"
                  value={renewForm.newEndDate}
                  onChange={(e) => setRenewForm({ ...renewForm, newEndDate: e.target.value })}
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-5 py-3 text-slate-400 hover:text-white font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Renew & Extend License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organization Details Modal */}
      {isEditModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 relative my-8">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">Organization Settings</span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-2">Edit Details: {selectedOrg.name}</h2>
              <p className="text-slate-400 text-xs">Update company name, contact information, plan tier, user seat limit, and subscription status.</p>
            </div>

            {formError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            <form onSubmit={handleUpdateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={editForm.contactName}
                    onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.contactEmail}
                    onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Plan Tier</label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Starter Plan">Starter Plan</option>
                    <option value="Professional Plan">Professional Plan</option>
                    <option value="Enterprise Plan">Enterprise Plan</option>
                    <option value="Enterprise Platform Holder">Enterprise Platform Holder</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">User Seats Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={editForm.maxUsers}
                    onChange={(e) => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">License Expiration Date</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-3 text-slate-400 hover:text-white font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" /> Update Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Remove Organization Confirmation Modal */}
      {isDeleteModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Delete Client Organization?</h2>
              <p className="text-slate-400 text-xs">
                Are you sure you want to permanently delete <strong className="text-white">{selectedOrg.name}</strong>?
                This action will delete the organization record and remove all user accounts associated with this tenant.
              </p>
            </div>

            {formError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrg}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
