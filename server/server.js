const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize DB with default data if not exists
const DEFAULTS = {
    users: [
        {
            id: "u1",
            name: "System Admin",
            email: "admin@desicrew.in",
            role: "Super Admin",
            department: "Admin",
            isActive: true,
            password: "password123",
            isLocked: false,
            loginAttempts: 0
        }
    ],
    evidence: [],
    dmax: [],
    activity: [],
    checklists: [
        { id: 'hr1', department: 'HR', task: 'Monthly Payroll Register Approval' },
        { id: 'hr2', department: 'HR', task: 'New Hire Documentation Completion' },
        { id: 'hr3', department: 'HR', task: 'Statutory Compliance (PF/ESI) Filing' },
        { id: 'it1', department: 'IT', task: 'Server Patch Management Log' },
        { id: 'it2', department: 'IT', task: 'Access Review Audit Trail' },
        { id: 'it3', department: 'IT', task: 'Backup & Disaster Recovery Test' },
        { id: 'op1', department: 'Operations', task: 'Daily Output Verification' },
        { id: 'op2', department: 'Operations', task: 'Quality Assurance Sample Test' },
        { id: 'op3', department: 'Operations', task: 'Shift Handover Documentation' }
    ]
};

function readDb() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULTS, null, 2));
        return DEFAULTS;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- API Endpoints ---

// Get all data (for initialization)
app.get('/api/data', (req, res) => {
    const db = readDb();
    res.json(db);
});

// USERS
app.post('/api/users', (req, res) => {
    const db = readDb();
    const newUser = req.body;
    // Basic validation
    if (db.users.find(u => u.email === newUser.email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    db.users.push(newUser);
    writeDb(db);
    res.json({ success: true, user: newUser });
});

app.put('/api/users/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const updates = req.body;
    const idx = db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...updates };
        writeDb(db);
        res.json({ success: true, user: db.users[idx] });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// ACTIVITIES
app.post('/api/activity', (req, res) => {
    const db = readDb();
    const newActivity = req.body;
    db.activity.unshift(newActivity);
    // Keep only last 1000
    if (db.activity.length > 1000) db.activity = db.activity.slice(0, 1000);
    writeDb(db);
    res.json({ success: true });
});

// CHECKLISTS
app.post('/api/checklists', (req, res) => {
    const db = readDb();
    db.checklists.push(req.body);
    writeDb(db);
    res.json({ success: true });
});

app.delete('/api/checklists/:id', (req, res) => {
    const db = readDb();
    db.checklists = db.checklists.filter(c => c.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
});

// EVIDENCE
app.post('/api/evidence', (req, res) => {
    const db = readDb();
    db.evidence.push(req.body);
    writeDb(db);
    res.json({ success: true });
});

// DMAX
app.post('/api/dmax', (req, res) => {
    const db = readDb();
    db.dmax.push(req.body);
    writeDb(db);
    res.json({ success: true });
});

app.put('/api/dmax/:id', (req, res) => {
    const db = readDb();
    const idx = db.dmax.findIndex(d => d.id === req.params.id);
    if (idx !== -1) {
        db.dmax[idx] = { ...db.dmax[idx], ...req.body };
        writeDb(db);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Report not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
