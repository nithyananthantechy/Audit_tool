import { User, ActivityLog, ChecklistItem, Evidence, DMAXReport } from './types';

const API_Base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
    getData: async () => {
        const res = await fetch(`${API_Base}/data`);
        return await res.json();
    },

    createUser: async (user: User) => {
        const res = await fetch(`${API_Base}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        return await res.json();
    },

    updateUser: async (user: User) => {
        const res = await fetch(`${API_Base}/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        return await res.json();
    },

    logActivity: async (activity: ActivityLog) => {
        const res = await fetch(`${API_Base}/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activity)
        });
        return await res.json();
    },

    addChecklist: async (checklist: ChecklistItem) => {
        const res = await fetch(`${API_Base}/checklists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checklist)
        });
        return await res.json();
    },

    deleteChecklist: async (id: string) => {
        const res = await fetch(`${API_Base}/checklists/${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    addEvidence: async (evidence: Evidence) => {
        const res = await fetch(`${API_Base}/evidence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(evidence)
        });
        return await res.json();
    },

    addDmax: async (dmax: DMAXReport) => {
        const res = await fetch(`${API_Base}/dmax`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dmax)
        });
        return await res.json();
    },

    updateDmax: async (dmax: DMAXReport) => {
        const res = await fetch(`${API_Base}/dmax/${dmax.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dmax)
        });
        return await res.json();
    }
};
