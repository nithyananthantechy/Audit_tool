const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.use(cors({
    origin: IS_PRODUCTION ? ['https://your-domain.com', 'http://your-domain.com'] : true,
    credentials: true
}));
app.use(express.json());

const DB_FILE = path.join(__dirname, 'audit.db');

const db = new Database(DB_FILE);

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        password TEXT NOT NULL,
        isLocked INTEGER DEFAULT 0,
        loginAttempts INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS evidence (
        id TEXT PRIMARY KEY,
        userId TEXT,
        userName TEXT,
        department TEXT,
        checklistId TEXT,
        description TEXT,
        fileName TEXT,
        fileType TEXT,
        submittedAt TEXT,
        status TEXT DEFAULT 'Pending'
    );
    CREATE TABLE IF NOT EXISTS dmax (
        id TEXT PRIMARY KEY,
        ticketId TEXT,
        department TEXT,
        description TEXT,
        severity TEXT,
        reportedBy TEXT,
        reportedAt TEXT,
        status TEXT DEFAULT 'Open',
        assignedTo TEXT,
        resolvedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS activity (
        id TEXT PRIMARY KEY,
        userId TEXT,
        userName TEXT,
        department TEXT,
        action TEXT,
        description TEXT,
        timestamp TEXT
    );
    CREATE TABLE IF NOT EXISTS checklists (
        id TEXT PRIMARY KEY,
        department TEXT NOT NULL,
        task TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        userId TEXT,
        expiresAt INTEGER
    );
`);

function initDefaults() {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
        const defaultUsers = [
            { id: 'u1', name: 'System Admin', email: 'admin@desicrew.in', role: 'Super Admin', department: 'Admin', isActive: 1, password: bcrypt.hashSync('password123', 10), isLocked: 0, loginAttempts: 0 },
            { id: '9ykf4mwwi', name: 'Gowri Amutha', email: 'gowriamutha@desicrew.in', role: 'Super Admin', department: 'IT', isActive: 1, password: bcrypt.hashSync('Desicrew@2026', 10), isLocked: 0, loginAttempts: 0 },
            { id: '011egr9ah', name: 'test', email: 'test@desicrew.in', role: 'Contributor', department: 'Operations', isActive: 1, password: bcrypt.hashSync('123', 10), isLocked: 0, loginAttempts: 0 }
        ];
        const insertUser = db.prepare('INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        defaultUsers.forEach(u => insertUser.run(u.id, u.name, u.email, u.role, u.department, u.isActive, u.password, u.isLocked, u.loginAttempts));
    }

    const checklistCount = db.prepare('SELECT COUNT(*) as count FROM checklists').get();
    if (checklistCount.count === 0) {
        const checklists = [
            { id: 'hr1', department: 'HR', task: 'Monthly Payroll Register Approval' },
            { id: 'hr2', department: 'HR', task: 'New Hire Documentation Completion' },
            { id: 'hr3', department: 'HR', task: 'Statutory Compliance (PF/ESI) Filing' },
            { id: 'it1', department: 'IT', task: 'Server Patch Management Log' },
            { id: 'it2', department: 'IT', task: 'Access Review Audit Trail' },
            { id: 'it3', department: 'IT', task: 'Backup & Disaster Recovery Test' },
            { id: 'op1', department: 'Operations', task: 'Daily Output Verification' },
            { id: 'op2', department: 'Operations', task: 'Quality Assurance Sample Test' },
            { id: 'op3', department: 'Operations', task: 'Shift Handover Documentation' }
        ];
        const insertChecklist = db.prepare('INSERT INTO checklists (id, department, task) VALUES (?, ?, ?)');
        checklists.forEach(c => insertChecklist.run(c.id, c.department, c.task));
    }
}
initDefaults();

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Auth middleware
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const token = authHeader.split(' ')[1];
    const tokenData = db.prepare('SELECT * FROM tokens WHERE token = ?').get(token);
    if (!tokenData) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    if (tokenData.expiresAt < Date.now()) {
        db.prepare('DELETE FROM tokens WHERE token = ?').run(token);
        return res.status(401).json({ error: 'Token expired' });
    }
    const user = db.prepare('SELECT id, name, email, role, department, isActive, isLocked, loginAttempts FROM users WHERE id = ?').get(tokenData.userId);
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    req.token = token;
    next();
}

// --- AUTH Endpoints ---

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        if (!user.isActive) return res.status(403).json({ error: 'Account disabled. Contact Super Admin.' });
        if (user.isLocked) return res.status(403).json({ error: 'Account locked. Contact Super Admin.' });

        const passwordMatch = bcrypt.compareSync(password.trim(), user.password);
        
        if (!passwordMatch) {
            console.log(`[AUTH] Failed login for ${email}`);
            const attempts = (user.loginAttempts || 0) + 1;
            db.prepare('UPDATE users SET loginAttempts = ? WHERE id = ?').run(attempts, user.id);
            if (attempts >= 3) {
                db.prepare('UPDATE users SET isLocked = 1 WHERE id = ?').run(user.id);
                return res.status(403).json({ error: 'Too many failed attempts. Account locked.' });
            }
            return res.status(401).json({ error: `Invalid password. ${3 - attempts} attempts remaining.` });
        }

        console.log(`[AUTH] Successful login for ${email}`);
        db.prepare('UPDATE users SET loginAttempts = 0 WHERE id = ?').run(user.id);

        const token = generateToken();
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
        db.prepare('INSERT INTO tokens (token, userId, expiresAt) VALUES (?, ?, ?)').run(token, user.id, expiresAt);

        const { password: _pw, ...safeUser } = user;
        res.json({ success: true, token, user: safeUser });
    } catch (err) {
        console.error('[AUTH ERROR]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM tokens WHERE token = ?').run(req.token);
    res.json({ success: true });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// --- API Endpoints ---

app.get('/api/data', (req, res) => {
    const users = db.prepare('SELECT id, name, email, role, department, isActive, isLocked, loginAttempts FROM users').all();
    const evidence = db.prepare('SELECT * FROM evidence').all();
    const dmax = db.prepare('SELECT * FROM dmax').all();
    const activity = db.prepare('SELECT * FROM activity ORDER BY timestamp DESC LIMIT 1000').all();
    const checklists = db.prepare('SELECT * FROM checklists').all();
    res.json({ users, evidence, dmax, activity, checklists });
});

app.post('/api/users', authMiddleware, (req, res) => {
    const newUser = req.body;
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(newUser.email);
    if (existing) {
        return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = bcrypt.hashSync(newUser.password, 10);
    db.prepare('INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(newUser.id, newUser.name, newUser.email, newUser.role, newUser.department, newUser.isActive !== false ? 1 : 0, hashedPassword, 0, 0);
    const { password: _pw, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser });
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true, user });
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.email) { fields.push('email = ?'); values.push(updates.email); }
    if (updates.role) { fields.push('role = ?'); values.push(updates.role); }
    if (updates.department) { fields.push('department = ?'); values.push(updates.department); }
    if (updates.isActive !== undefined) { fields.push('isActive = ?'); values.push(updates.isActive ? 1 : 0); }
    if (updates.password) { 
        fields.push('password = ?'); 
        values.push(bcrypt.hashSync(updates.password, 10)); 
    }
    if (updates.isLocked !== undefined) { fields.push('isLocked = ?'); values.push(updates.isLocked ? 1 : 0); }
    
    if (fields.length > 0) {
        values.push(id);
        db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    const user = db.prepare('SELECT id, name, email, role, department, isActive, isLocked, loginAttempts FROM users WHERE id = ?').get(id);
    res.json({ success: true, user });
});

app.post('/api/activity', (req, res) => {
    const newActivity = req.body;
    db.prepare('INSERT INTO activity (id, userId, userName, department, action, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)').run(newActivity.id, newActivity.userId, newActivity.userName, newActivity.department, newActivity.action, newActivity.description, newActivity.timestamp);
    res.json({ success: true });
});

app.post('/api/checklists', authMiddleware, (req, res) => {
    const checklist = req.body;
    db.prepare('INSERT INTO checklists (id, department, task) VALUES (?, ?, ?)').run(checklist.id, checklist.department, checklist.task);
    res.json({ success: true });
});

app.delete('/api/checklists/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM checklists WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

app.post('/api/evidence', authMiddleware, (req, res) => {
    const evidence = req.body;
    db.prepare('INSERT INTO evidence (id, userId, userName, department, checklistId, description, fileName, fileType, submittedAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(evidence.id, evidence.userId, evidence.userName, evidence.department, evidence.checklistId, evidence.description, evidence.fileName, evidence.fileType, evidence.submittedAt, evidence.status || 'Pending');
    res.json({ success: true });
});

app.put('/api/evidence/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.description) { fields.push('description = ?'); values.push(updates.description); }
    if (fields.length > 0) {
        values.push(id);
        db.prepare(`UPDATE evidence SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });
});

app.post('/api/dmax', authMiddleware, (req, res) => {
    const dmax = req.body;
    db.prepare('INSERT INTO dmax (id, ticketId, department, description, severity, reportedBy, reportedAt, status, assignedTo, resolvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(dmax.id, dmax.ticketId, dmax.department, dmax.description, dmax.severity, dmax.reportedBy, dmax.reportedAt, dmax.status || 'Open', dmax.assignedTo || null, dmax.resolvedAt || null);
    res.json({ success: true });
});

app.put('/api/dmax/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const fields = [];
    const values = [];
    if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.assignedTo) { fields.push('assignedTo = ?'); values.push(updates.assignedTo); }
    if (updates.resolvedAt) { fields.push('resolvedAt = ?'); values.push(updates.resolvedAt); }
    if (fields.length > 0) {
        values.push(id);
        db.prepare(`UPDATE dmax SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });
});

// Catch-all
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
    console.error('[SERVER ERROR]', err);
});