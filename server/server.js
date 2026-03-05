const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const app = express();
const PORT = 3001;

app.use(cors({
    origin: function (origin, callback) {
        // Allow any 192.168.x.x origin or localhost for local network access
        if (!origin || origin.startsWith('http://localhost') || /^http:\/\/192\.168\.\d+\.\d+(:3000)?$/.test(origin)) {
            callback(null, true);
        } else {
            console.log("CORS blocked origin:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'desicrew-audit-secret-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

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
        return JSON.parse(JSON.stringify(DEFAULTS));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- AUTH Endpoints ---

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const db = readDb();
    const user = db.users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account disabled. Contact Super Admin.' });
    if (user.isLocked) return res.status(403).json({ error: 'Account locked. Contact Super Admin.' });

    const storedPwd = (user.password || 'password123').trim();
    const providedPwd = (password || '').trim();

    if (providedPwd !== storedPwd) {
        console.log(`[AUTH] Failed login for ${email}. Provided: "${providedPwd}", Stored: "${storedPwd}"`);
        const attempts = (user.loginAttempts || 0) + 1;
        const idx = db.users.findIndex(u => u.id === user.id);
        db.users[idx].loginAttempts = attempts;
        if (attempts >= 3) {
            db.users[idx].isLocked = true;
            writeDb(db);
            return res.status(403).json({ error: 'Too many failed attempts. Account locked.' });
        }
        writeDb(db);
        return res.status(401).json({ error: `Invalid password. ${3 - attempts} attempts remaining.` });
    }

    console.log(`[AUTH] Successful login for ${email}`);

    // Reset login attempts on success
    const idx = db.users.findIndex(u => u.id === user.id);
    db.users[idx].loginAttempts = 0;
    writeDb(db);

    // Store user in session (never store password in session)
    const { password: _pw, ...safeUser } = db.users[idx];
    req.session.userId = safeUser.id;
    req.session.user = safeUser;

    res.json({ success: true, user: safeUser });
});

// Get current session user
app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    // Always re-read from DB to get latest user state
    const db = readDb();
    const user = db.users.find(u => u.id === req.session.userId);
    if (!user) return res.status(401).json({ error: 'Session invalid' });
    const { password: _pw, ...safeUser } = user;
    req.session.user = safeUser; // refresh session
    res.json({ user: safeUser });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, '../dist')));

// --- API Endpoints ---

// Get all data (for initialization)
app.get('/api/data', (req, res) => {
    const db = readDb();
    // Never send passwords to frontend
    const safeUsers = db.users.map(({ password, ...u }) => u);
    res.json({ ...db, users: safeUsers });
});

// USERS
app.post('/api/users', (req, res) => {
    const db = readDb();
    const newUser = req.body;
    if (db.users.find(u => u.email === newUser.email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    db.users.push(newUser);
    writeDb(db);
    const { password: _pw, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser });
});

app.put('/api/users/:id', (req, res) => {
    const db = readDb();
    const { id } = req.params;
    const updates = req.body;
    const idx = db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...updates };
        writeDb(db);
        const { password: _pw, ...safeUser } = db.users[idx];
        res.json({ success: true, user: safeUser });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// ACTIVITIES
app.post('/api/activity', (req, res) => {
    const db = readDb();
    const newActivity = req.body;
    db.activity.unshift(newActivity);
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

app.put('/api/evidence/:id', (req, res) => {
    const db = readDb();
    const idx = db.evidence.findIndex(e => e.id === req.params.id);
    if (idx !== -1) {
        db.evidence[idx] = { ...db.evidence[idx], ...req.body };
        writeDb(db);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Evidence not found' });
    }
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

// Catch-all to serve index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
