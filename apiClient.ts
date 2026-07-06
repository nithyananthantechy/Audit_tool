import { User, ActivityLog, ChecklistItem, Evidence, CAPAReport } from './types';

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

    me: async () => {
        return fetchJSON(`${API_Base}/auth/me`);
    },

    logout: async () => {
        const result = await fetchJSON(`${API_Base}/auth/logout`, { method: 'POST' });
        setAuthToken(null);
        return result;
    },

    getData: async () => {
        return fetchJSON(`${API_Base}/data`);
    },

    createUser: async (user: User) => {
        return fetchJSON(`${API_Base}/users`, {
            method: 'POST',
            body: JSON.stringify(user)
        });
    },

    updateUser: async (user: User) => {
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

    logActivity: async (activity: ActivityLog) => {
        return fetchJSON(`${API_Base}/activity`, {
            method: 'POST',
            body: JSON.stringify(activity)
        });
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

    addEvidence: async (evidence: Evidence) => {
        return fetchJSON(`${API_Base}/evidence`, {
            method: 'POST',
            body: JSON.stringify(evidence)
        });
    },

    updateEvidence: async (evidence: Evidence) => {
        return fetchJSON(`${API_Base}/evidence/${evidence.id}`, {
            method: 'PUT',
            body: JSON.stringify(evidence)
        });
    },

    addCapa: async (capa: CAPAReport) => {
        return fetchJSON(`${API_Base}/capa`, {
            method: 'POST',
            body: JSON.stringify(capa)
        });
    },

    updateCapa: async (capa: CAPAReport) => {
        return fetchJSON(`${API_Base}/capa/${capa.id}`, {
            method: 'PUT',
            body: JSON.stringify(capa)
        });
    },

    getAIInsights: async (context: string, promptType: 'evidence' | 'capa') => {
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
    }
};