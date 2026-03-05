import { User, ActivityLog, ChecklistItem, Evidence, DMAXReport } from './types';

const API_Base = '/api';

const fetchJSON = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
        ...options,
        credentials: 'include',  // Required for session cookies
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    return res.json();
};

export const api = {
    // --- AUTH ---
    login: async (email: string, password: string) => {
        return fetchJSON(`${API_Base}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    me: async () => {
        return fetchJSON(`${API_Base}/auth/me`);
    },

    logout: async () => {
        return fetchJSON(`${API_Base}/auth/logout`, { method: 'POST' });
    },

    // --- DATA ---
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

    addDmax: async (dmax: DMAXReport) => {
        return fetchJSON(`${API_Base}/dmax`, {
            method: 'POST',
            body: JSON.stringify(dmax)
        });
    },

    updateDmax: async (dmax: DMAXReport) => {
        return fetchJSON(`${API_Base}/dmax/${dmax.id}`, {
            method: 'PUT',
            body: JSON.stringify(dmax)
        });
    }
};
