import { User, ActivityLog, ChecklistItem, Evidence, CAPAReport, Control, RiskItem, Finding, AuditSchedule, NotificationItem, AuditIntegrityResult, AIInsightResult } from './types';

const API_Base = getApiBaseUrl();

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
}

const fetchJSON = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.headers && typeof options.headers === 'object') {
    Object.assign(headers, options.headers);
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
};

export const api = {
  login: async (email: string, password: string) => {
    const result = await fetchJSON(`${API_Base}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (result.token) {
      setAuthToken(result.token);
    }
    return result;
  },

  setupMfa: async () => {
    return fetchJSON(`${API_Base}/mfa/setup`, { method: 'POST' });
  },

  verifyMfa: async (userId: string, token: string, challengeToken?: string) => {
    const result = await fetchJSON(`${API_Base}/mfa/verify`, {
      method: 'POST',
      body: JSON.stringify({ userId, token, challengeToken })
    });
    if (result.token) {
      setAuthToken(result.token);
    }
    return result;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return fetchJSON(`${API_Base}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  },

  me: async () => {
    return fetchJSON(`${API_Base}/auth/me`);
  },

  logout: async () => {
    try {
      await fetchJSON(`${API_Base}/auth/logout`, { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    setAuthToken(null);
    return { success: true };
  },

  getData: async () => {
    return fetchJSON(`${API_Base}/data`);
  },

  createUser: async (user: Partial<User>) => {
    return fetchJSON(`${API_Base}/users`, {
      method: 'POST',
      body: JSON.stringify(user)
    });
  },

  updateUser: async (user: Partial<User> & { id: string }) => {
    return fetchJSON(`${API_Base}/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    });
  },

  deleteUser: async (userId: string) => {
    return fetchJSON(`${API_Base}/users/${userId}`, {
      method: 'DELETE'
    });
  },

  logActivity: async (activity: Partial<ActivityLog>) => {
    return fetchJSON(`${API_Base}/activity`, {
      method: 'POST',
      body: JSON.stringify(activity)
    });
  },

  getAuditIntegrity: async (): Promise<AuditIntegrityResult> => {
    return fetchJSON(`${API_Base}/audit-log/integrity`);
  },

  addChecklist: async (checklist: ChecklistItem) => {
    return fetchJSON(`${API_Base}/checklists`, {
      method: 'POST',
      body: JSON.stringify(checklist)
    });
  },

  deleteChecklist: async (id: string) => {
    return fetchJSON(`${API_Base}/checklists/${id}`, { method: 'DELETE' });
  },

  addEvidence: async (evidence: Partial<Evidence>) => {
    return fetchJSON(`${API_Base}/evidence`, {
      method: 'POST',
      body: JSON.stringify({
        ...evidence,
        checklistId: evidence.checklistId || evidence.checklistItemId
      })
    });
  },

  updateEvidence: async (evidence: Partial<Evidence> & { id: string }) => {
    return fetchJSON(`${API_Base}/evidence/${evidence.id}`, {
      method: 'PUT',
      body: JSON.stringify(evidence)
    });
  },

  addCapa: async (capa: Partial<CAPAReport>) => {
    return fetchJSON(`${API_Base}/capa`, {
      method: 'POST',
      body: JSON.stringify(capa)
    });
  },

  updateCapa: async (capa: Partial<CAPAReport> & { id: string }) => {
    return fetchJSON(`${API_Base}/capa/${capa.id}`, {
      method: 'PUT',
      body: JSON.stringify(capa)
    });
  },

  getControls: async (): Promise<Control[]> => {
    return fetchJSON(`${API_Base}/controls`);
  },

  addControl: async (control: Partial<Control>) => {
    return fetchJSON(`${API_Base}/controls`, {
      method: 'POST',
      body: JSON.stringify(control)
    });
  },

  getRisks: async (): Promise<RiskItem[]> => {
    return fetchJSON(`${API_Base}/risks`);
  },

  addRisk: async (risk: Partial<RiskItem>) => {
    return fetchJSON(`${API_Base}/risks`, {
      method: 'POST',
      body: JSON.stringify(risk)
    });
  },

  getFindings: async (): Promise<Finding[]> => {
    return fetchJSON(`${API_Base}/findings`);
  },

  addFinding: async (finding: Partial<Finding>) => {
    return fetchJSON(`${API_Base}/findings`, {
      method: 'POST',
      body: JSON.stringify(finding)
    });
  },

  getNotifications: async (): Promise<{ notifications: NotificationItem[]; unreadCount: number }> => {
    return fetchJSON(`${API_Base}/notifications`);
  },

  markNotificationRead: async (id: string) => {
    return fetchJSON(`${API_Base}/notifications/${id}/read`, { method: 'PUT' });
  },

  markAllNotificationsRead: async () => {
    return fetchJSON(`${API_Base}/notifications/read-all`, { method: 'PUT' });
  },

  getAIInsights: async (context: string, promptType: 'evidence' | 'capa'): Promise<AIInsightResult> => {
    return fetchJSON(`${API_Base}/analytics/ai-insights`, {
      method: 'POST',
      body: JSON.stringify({ context, promptType })
    });
  },

  getComplianceScore: async (department?: string) => {
    const url = department
      ? `${API_Base}/analytics/compliance-score?department=${encodeURIComponent(department)}`
      : `${API_Base}/analytics/compliance-score`;
    return fetchJSON(url);
  },

  getOrganizations: async (): Promise<{ success: boolean; organizations: any[] }> => {
    return fetchJSON(`${API_Base}/admin/organizations`);
  },

  createOrganization: async (orgData: any) => {
    return fetchJSON(`${API_Base}/admin/organizations`, {
      method: 'POST',
      body: JSON.stringify(orgData)
    });
  },

  updateOrganization: async (id: string, orgData: any) => {
    return fetchJSON(`${API_Base}/admin/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orgData)
    });
  },

  renewLicense: async (id: string, renewalData: any) => {
    return fetchJSON(`${API_Base}/admin/organizations/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(renewalData)
    });
  },

  deleteOrganization: async (id: string) => {
    return fetchJSON(`${API_Base}/admin/organizations/${id}`, {
      method: 'DELETE'
    });
  },

  uploadFile: async (file: File): Promise<{ success: boolean; fileUrl: string; fileName: string; fileSize: string; fileType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const res = await fetchJSON(`${API_Base}/upload`, {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type || 'application/octet-stream',
              fileData: base64Data
            })
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file buffer.'));
      reader.readAsDataURL(file);
    });
  },

  // Enterprise GRC API Client Methods
  getAudits: async () => fetchJSON(`${API_Base}/audits`),
  createAudit: async (auditData: any) => fetchJSON(`${API_Base}/audits`, { method: 'POST', body: JSON.stringify(auditData) }),
  updateAudit: async (id: string, auditData: any) => fetchJSON(`${API_Base}/audits/${id}`, { method: 'PUT', body: JSON.stringify(auditData) }),
  getAuditScope: async (id: string) => fetchJSON(`${API_Base}/audits/${id}/scope`),
  getFrameworks: async () => fetchJSON(`${API_Base}/frameworks`),
  getRequirements: async (frameworkId?: string) => fetchJSON(frameworkId ? `${API_Base}/requirements?frameworkId=${encodeURIComponent(frameworkId)}` : `${API_Base}/requirements`),
  getControlMappings: async () => fetchJSON(`${API_Base}/control-mappings`),
  createControlMapping: async (mapping: any) => fetchJSON(`${API_Base}/control-mappings`, { method: 'POST', body: JSON.stringify(mapping) }),
  getEvidenceRequests: async () => fetchJSON(`${API_Base}/evidence-requests`),
  createEvidenceRequest: async (reqData: any) => fetchJSON(`${API_Base}/evidence-requests`, { method: 'POST', body: JSON.stringify(reqData) }),
  getControlTests: async (auditId?: string) => fetchJSON(auditId ? `${API_Base}/control-tests?auditId=${encodeURIComponent(auditId)}` : `${API_Base}/control-tests`),
  submitControlTest: async (testData: any) => fetchJSON(`${API_Base}/control-tests`, { method: 'POST', body: JSON.stringify(testData) }),
  retestFinding: async (findingId: string, retestData: any) => fetchJSON(`${API_Base}/findings/${findingId}/retest`, { method: 'POST', body: JSON.stringify(retestData) }),
  getPolicies: async () => fetchJSON(`${API_Base}/policies`),
  createPolicy: async (policyData: any) => fetchJSON(`${API_Base}/policies`, { method: 'POST', body: JSON.stringify(policyData) }),
  getVendors: async () => fetchJSON(`${API_Base}/vendors`),
  createVendor: async (vendorData: any) => fetchJSON(`${API_Base}/vendors`, { method: 'POST', body: JSON.stringify(vendorData) }),
  getAssets: async () => fetchJSON(`${API_Base}/assets`),
  createAsset: async (assetData: any) => fetchJSON(`${API_Base}/assets`, { method: 'POST', body: JSON.stringify(assetData) }),
  getDPDPInventory: async () => fetchJSON(`${API_Base}/dpdp-inventory`),
  createDPDPRecord: async (recordData: any) => fetchJSON(`${API_Base}/dpdp-inventory`, { method: 'POST', body: JSON.stringify(recordData) }),
  getIncidents: async () => fetchJSON(`${API_Base}/incidents`),
  createIncident: async (incidentData: any) => fetchJSON(`${API_Base}/incidents`, { method: 'POST', body: JSON.stringify(incidentData) }),
  getTraceability: async (findingId: string) => fetchJSON(`${API_Base}/traceability/${encodeURIComponent(findingId)}`),
  getDepartments: async () => fetchJSON(`${API_Base}/departments`),
  createDepartment: async (name: string) => fetchJSON(`${API_Base}/departments`, { method: 'POST', body: JSON.stringify({ name }) }),
  deleteDepartment: async (name: string) => fetchJSON(`${API_Base}/departments/${encodeURIComponent(name)}`, { method: 'DELETE' })
};

export const apiClient = api;