const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '../.env.production' });
const sql = neon(process.env.DATABASE_URL);

class MockDatabase {
    prepare(queryStr) {
        let paramCount = 0;
        const pgQuery = queryStr.replace(/\?/g, () => {
            paramCount++;
            return '$' + paramCount;
        });
        
        const casingMap = {
            userid: 'userId',
            expiresat: 'expiresAt',
            isactive: 'isActive',
            islocked: 'isLocked',
            loginattempts: 'loginAttempts',
            reportedat: 'reportedAt',
            resolvedat: 'resolvedAt',
            createdat: 'createdAt',
            assignedto: 'assignedTo',
            submissionscore: 'submissionScore',
            approvalscore: 'approvalScore',
            inapp: 'inApp'
        };
        const mapRow = (row) => {
            if (!row) return row;
            const newRow = { ...row };
            for (const [key, val] of Object.entries(newRow)) {
                if (casingMap[key]) {
                    newRow[casingMap[key]] = val;
                    delete newRow[key];
                }
            }
            return newRow;
        };
        return {
            get: async (...args) => {
                try {
                  const res = await sql.query(pgQuery, args);
                  return mapRow(res[0]);
                } catch(e) {
                  console.error("GET ERROR on", pgQuery, args, e);
                  throw e;
                }
            },
            all: async (...args) => {
                try {
                  const res = await sql.query(pgQuery, args);
                  return res.map(mapRow);
                } catch(e) {
                  console.error("ALL ERROR on", pgQuery, args, e);
                  throw e;
                }
            },
            run: async (...args) => {
                try {
                  const res = await sql.query(pgQuery, args);
                  return res;
                } catch(e) {
                  console.error("RUN ERROR on", pgQuery, args, e);
                  throw e;
                }
            }
        };
    }
    async exec(queryStr) {
        const queries = queryStr.split(';').filter(q => q.trim().length > 0);
        for (const q of queries) {
            try {
                await sql.query(q);
            } catch (err) {
                console.error("DB Init Error:", err);
            }
        }
    }
}
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();

const rateLimitStore = new Map();
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

async function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const data = await rateLimitStore.get(ip);
    if (now > data.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else {
      data.count++;
      if (data.count > RATE_LIMIT) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
    }
  }
  next();
}

app.use(rateLimitMiddleware);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://esm.sh; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:;");
  next();
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: IS_PRODUCTION ? ['https://your-domain.com', 'http://your-domain.com'] : true,
  credentials: true
}));
app.use(express.json());

const DB_FILE = path.join(__dirname, 'audit.db');

const db = new MockDatabase();

async function initDefaults() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        isActive SMALLINT DEFAULT 1,
        password TEXT NOT NULL,
        isLocked SMALLINT DEFAULT 0,
        loginAttempts SMALLINT DEFAULT 0
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
        expiresAt BIGINT
    );
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        isRead SMALLINT DEFAULT 0,
        createdAt TEXT NOT NULL,
        relatedId TEXT,
        relatedType TEXT
    );
    CREATE TABLE IF NOT EXISTS notification_preferences (
        userId TEXT PRIMARY KEY,
        inApp SMALLINT DEFAULT 1,
        email SMALLINT DEFAULT 1,
        submission SMALLINT DEFAULT 1,
        approval SMALLINT DEFAULT 1,
        deadline SMALLINT DEFAULT 1,
        assignment SMALLINT DEFAULT 1
    );
  `);
  const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (Number(userCount.count) === 0) {
    const defaultUsers = [
    { id: 'u1', name: 'System Admin', email: 'admin@desicrew.in', role: 'Super Admin', department: 'Admin', isActive: 1, password: bcrypt.hashSync('password123', 10), isLocked: 0, loginAttempts: 0 },
    { id: '9ykf4mwwi', name: 'Gowri Amutha', email: 'gowriamutha@desicrew.in', role: 'Super Admin', department: 'IT', isActive: 1, password: bcrypt.hashSync('Desicrew@2026', 10), isLocked: 0, loginAttempts: 0 },
    { id: '011egr9ah', name: 'test', email: 'test@desicrew.in', role: 'Contributor', department: 'Operations', isActive: 1, password: bcrypt.hashSync('123', 10), isLocked: 0, loginAttempts: 0 }];

    const insertUser = db.prepare('INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const u of defaultUsers) {
      await insertUser.run(u.id, u.name, u.email, u.role, u.department, u.isActive, u.password, u.isLocked, u.loginAttempts);
    }
  }

  const checklistCount = await db.prepare('SELECT COUNT(*) as count FROM checklists').get();
  if (Number(checklistCount.count) === 0) {
    const checklists = [
    { id: 'hr1', department: 'HR', task: 'Monthly Payroll Register Approval' },
    { id: 'hr2', department: 'HR', task: 'New Hire Documentation Completion' },
    { id: 'hr3', department: 'HR', task: 'Statutory Compliance (PF/ESI) Filing' },
    { id: 'it1', department: 'IT', task: 'Server Patch Management Log' },
    { id: 'it2', department: 'IT', task: 'Access Review Audit Trail' },
    { id: 'it3', department: 'IT', task: 'Backup & Disaster Recovery Test' },
    { id: 'op1', department: 'Operations', task: 'Daily Output Verification' },
    { id: 'op2', department: 'Operations', task: 'Quality Assurance Sample Test' },
    { id: 'op3', department: 'Operations', task: 'Shift Handover Documentation' }];

    const insertChecklist = db.prepare('INSERT INTO checklists (id, department, task) VALUES (?, ?, ?)');
    for (const c of checklists) {
      await insertChecklist.run(c.id, c.department, c.task);
    }
  }
}
initDefaults().catch(console.error);

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Auth middleware
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = authHeader.split(' ')[1];
  const tokenData = await db.prepare('SELECT * FROM tokens WHERE token = ?').get(token);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (tokenData.expiresAt < Date.now()) {
    await db.prepare('DELETE FROM tokens WHERE token = ?').run(token);
    return res.status(401).json({ error: 'Token expired' });
  }
  const user = await db.prepare('SELECT id, name, email, role, department, isActive, isLocked, loginAttempts FROM users WHERE id = ?').get(tokenData.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  req.user = user;
  req.token = token;
  next();
}

// Notification helper functions
async function sendNotification(userId, type, title, message, relatedId = null, relatedType = null) {
  const notification = {
    id: crypto.randomBytes(8).toString('hex'),
    userId,
    type,
    title,
    message,
    isRead: 0,
    createdAt: new Date().toISOString(),
    relatedId,
    relatedType
  };

  await db.prepare('INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt, relatedId, relatedType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').
  run(notification.id, notification.userId, notification.type, notification.title, notification.message, notification.isRead, notification.createdAt, notification.relatedId, notification.relatedType);

  await sendEmailNotification(userId, type, title, message);

  return notification;
}

async function sendEmailNotification(userId, type, title, message) {
  const prefs = await db.prepare('SELECT * FROM notification_preferences WHERE userId = ?').get(userId);
  if (prefs && prefs.email === 0) return;

  if (type === 'submission' && prefs && prefs.submission === 0) return;
  if (type === 'approval' && prefs && prefs.approval === 0) return;
  if (type === 'deadline' && prefs && prefs.deadline === 0) return;
  if (type === 'assignment' && prefs && prefs.assignment === 0) return;

  const user = await db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
  if (!user || !process.env.SMTP_USER) return;

  try {
    await transporter.sendMail({
      from: `"DesiCrew Audit" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `[Audit Tool] ${title}`,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                <h2 style="color: #2563eb;">${title}</h2>
                <p style="color: #374151; font-size: 14px;">${message}</p>
                <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">This is an automated notification from DesiCrew Audit & Compliance Manager.</p>
            </div>`
    });
  } catch (err) {
    console.log('[EMAIL] Failed to send:', err.message);
  }
}

const getDepartmentManagers = async (department) => {
  return await db.prepare('SELECT id, name FROM users WHERE department = ? AND role IN (?, ?) AND isActive = 1').all(department, 'Super Admin', 'Admin');
};

// --- AUTH Endpoints ---

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account disabled. Contact Super Admin.' });
    if (user.isLocked) return res.status(403).json({ error: 'Account locked. Contact Super Admin.' });

    const passwordMatch = bcrypt.compareSync(password.trim(), user.password);

    if (!passwordMatch) {
      console.log(`[AUTH] Failed login for ${email}`);
      const attempts = (user.loginAttempts || 0) + 1;
      await db.prepare('UPDATE users SET loginAttempts = ? WHERE id = ?').run(attempts, user.id);
      if (attempts >= 3) {
        await db.prepare('UPDATE users SET isLocked = 1 WHERE id = ?').run(user.id);
        return res.status(403).json({ error: 'Too many failed attempts. Account locked.' });
      }
      return res.status(401).json({ error: `Invalid password. ${3 - attempts} attempts remaining.` });
    }

    console.log(`[AUTH] Successful login for ${email}`);
    await db.prepare('UPDATE users SET loginAttempts = 0 WHERE id = ?').run(user.id);

    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    await db.prepare('INSERT INTO tokens (token, userId, expiresAt) VALUES (?, ?, ?)').run(token, user.id, expiresAt);

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

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  await db.prepare('DELETE FROM tokens WHERE token = ?').run(req.token);
  res.json({ success: true });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// --- API Endpoints ---

app.get('/api/data', async (req, res) => {
  const users = await db.prepare('SELECT id, name, email, role, department, isActive, isLocked, loginAttempts FROM users').all();
  const evidence = await db.prepare('SELECT * FROM evidence').all();
  const dmax = await db.prepare('SELECT * FROM dmax').all();
  const activity = await db.prepare('SELECT * FROM activity ORDER BY timestamp DESC LIMIT 1000').all();
  const checklists = await db.prepare('SELECT * FROM checklists').all();
  res.json({ users, evidence, dmax, activity, checklists });
});

app.post('/api/users', authMiddleware, async (req, res) => {
  const newUser = req.body;
  const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(newUser.email);
  if (existing) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const hashedPassword = bcrypt.hashSync(newUser.password, 10);
  await db.prepare('INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(newUser.id, newUser.name, newUser.email, newUser.role, newUser.department, newUser.isActive !== false ? 1 : 0, hashedPassword, 0, 0);
  const { password: _pw, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser });
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user = await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ success: true, user });
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = [];
  const values = [];
  if (updates.name) {fields.push('name = ?');values.push(updates.name);}
  if (updates.email) {fields.push('email = ?');values.push(updates.email);}
  if (updates.role) {fields.push('role = ?');values.push(updates.role);}
  if (updates.department) {fields.push('department = ?');values.push(updates.department);}
  if (updates.isActive !== undefined) {fields.push('isActive = ?');values.push(updates.isActive ? 1 : 0);}
  if (updates.password) {
    fields.push('password = ?');
    values.push(bcrypt.hashSync(updates.password, 10));
  }
  if (updates.isLocked !== undefined) {fields.push('isLocked = ?');values.push(updates.isLocked ? 1 : 0);}

  if (fields.length > 0) {
    values.push(id);
    await db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  const user = await db.prepare('SELECT id, name, email, role, department, isActive, isLocked, loginAttempts FROM users WHERE id = ?').get(id);
  res.json({ success: true, user });
});

app.post('/api/activity', async (req, res) => {
  const newActivity = req.body;
  await db.prepare('INSERT INTO activity (id, userId, userName, department, action, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)').run(newActivity.id, newActivity.userId, newActivity.userName, newActivity.department, newActivity.action, newActivity.description, newActivity.timestamp);
  res.json({ success: true });
});

app.post('/api/checklists', authMiddleware, async (req, res) => {
  const checklist = req.body;
  await db.prepare('INSERT INTO checklists (id, department, task) VALUES (?, ?, ?)').run(checklist.id, checklist.department, checklist.task);
  res.json({ success: true });
});

app.delete('/api/checklists/:id', authMiddleware, async (req, res) => {
  await db.prepare('DELETE FROM checklists WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/evidence', authMiddleware, async (req, res) => {
  const evidence = req.body;
  await db.prepare('INSERT INTO evidence (id, userId, userName, department, checklistId, description, fileName, fileType, submittedAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(evidence.id, evidence.userId, evidence.userName, evidence.department, evidence.checklistId, evidence.description, evidence.fileName, evidence.fileType, evidence.submittedAt, evidence.status || 'Pending');

  const managers = await getDepartmentManagers(evidence.department);
  managers.forEach((m) => {
    sendNotification(m.id, 'submission', 'New Evidence Submitted', `${evidence.userName} submitted evidence for review.`);
  });

  res.json({ success: true });
});

app.put('/api/evidence/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = [];
  const values = [];
  if (updates.status) {
    fields.push('status = ?');
    values.push(updates.status);

    const evidence = await db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
    if (evidence) {
      const userId = evidence.userId;
      const status = updates.status;
      if (status === 'Manager Approved' || status === 'Final Audit Completed') {
        sendNotification(userId, 'approval', 'Evidence Approved', `Your submission has been ${status}.`);
      } else if (status === 'Rejected') {
        sendNotification(userId, 'rejection', 'Evidence Rejected', `Your submission was rejected. Please review and resubmit.`);
      }
    }
  }
  if (updates.description) {fields.push('description = ?');values.push(updates.description);}
  if (fields.length > 0) {
    values.push(id);
    await db.prepare(`UPDATE evidence SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  res.json({ success: true });
});

app.post('/api/dmax', authMiddleware, async (req, res) => {
  const dmax = req.body;
  await db.prepare('INSERT INTO dmax (id, ticketId, department, description, severity, reportedBy, reportedAt, status, assignedTo, resolvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(dmax.id, dmax.ticketId, dmax.department, dmax.description, dmax.severity, dmax.reportedBy, dmax.reportedAt, dmax.status || 'Open', dmax.assignedTo || null, dmax.resolvedAt || null);

  if (dmax.assignedTo) {
    sendNotification(dmax.assignedTo, 'assignment', 'DMAX Ticket Assigned', `Ticket #${dmax.ticketId} has been assigned to you.`);
  }

  res.json({ success: true });
});

app.put('/api/dmax/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = [];
  const values = [];
  if (updates.status) {fields.push('status = ?');values.push(updates.status);}
  if (updates.assignedTo) {
    fields.push('assignedTo = ?');
    values.push(updates.assignedTo);
    sendNotification(updates.assignedTo, 'assignment', 'DMAX Ticket Assigned', `A new DMAX ticket has been assigned to you.`);
  }
  if (updates.resolvedAt) {fields.push('resolvedAt = ?');values.push(updates.resolvedAt);}
  if (fields.length > 0) {
    values.push(id);
    await db.prepare(`UPDATE dmax SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  res.json({ success: true });
});

// --- Notification Endpoints ---

app.get('/api/notifications', authMiddleware, async (req, res) => {
  const notifications = await db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 100').all(req.user.id);
  const unreadCount = await db.prepare('SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0').get(req.user.id);
  res.json({ notifications, unreadCount: Number(unreadCount.count) });
});

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  await db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  await db.prepare('UPDATE notifications SET isRead = 1 WHERE userId = ?').run(req.user.id);
  res.json({ success: true });
});

app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
  await db.prepare('DELETE FROM notifications WHERE id = ? AND userId = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

app.get('/api/notifications/preferences', authMiddleware, async (req, res) => {
  let prefs = await db.prepare('SELECT * FROM notification_preferences WHERE userId = ?').get(req.user.id);
  if (!prefs) {
    await db.prepare('INSERT INTO notification_preferences (userId, inApp, email, submission, approval, deadline, assignment) VALUES (?, 1, 1, 1, 1, 1, 1)').run(req.user.id);
    prefs = await db.prepare('SELECT * FROM notification_preferences WHERE userId = ?').get(req.user.id);
  }
  res.json(prefs);
});

app.put('/api/notifications/preferences', authMiddleware, async (req, res) => {
  const { inApp, email, submission, approval, deadline, assignment } = req.body;
  await db.prepare(`INSERT INTO notification_preferences (userId, inApp, email, submission, approval, deadline, assignment) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (userId) DO UPDATE SET inApp = EXCLUDED.inApp, email = EXCLUDED.email, submission = EXCLUDED.submission, approval = EXCLUDED.approval, deadline = EXCLUDED.deadline, assignment = EXCLUDED.assignment`).
  run(req.user.id, inApp ? 1 : 0, email ? 1 : 0, submission ? 1 : 0, approval ? 1 : 0, deadline ? 1 : 0, assignment ? 1 : 0);
  res.json({ success: true });
});

// --- AI Analytics Endpoints ---

app.get('/api/analytics/compliance-score', authMiddleware, async (req, res) => {
  const department = req.query.department;

  const totalChecklists = department ?
  (await db.prepare('SELECT COUNT(*) as count FROM checklists WHERE department = ?').get(department)).count :
  (await db.prepare('SELECT COUNT(*) as count FROM checklists').get()).count;

  const totalUsers = department ?
  (await db.prepare('SELECT COUNT(*) as count FROM users WHERE department = ? AND role IN (?, ?)').get(department, 'Contributor', 'Team Lead')).count :
  (await db.prepare('SELECT COUNT(*) as count FROM users WHERE role IN (?, ?)').get('Contributor', 'Team Lead')).count;

  let submittedEvidence, approvedEvidence;

  if (department) {
    submittedEvidence = (await db.prepare('SELECT COUNT(DISTINCT checklistId || userId) as count FROM evidence WHERE department = ?').get(department)).count;
    approvedEvidence = (await db.prepare('SELECT COUNT(*) as count FROM evidence WHERE department = ? AND status IN (?, ?)').get(department, 'Manager Approved', 'Final Audit Completed')).count;
  } else {
    submittedEvidence = (await db.prepare('SELECT COUNT(DISTINCT checklistId || userId) as count FROM evidence').get()).count;
    approvedEvidence = (await db.prepare('SELECT COUNT(*) as count FROM evidence WHERE status IN (?, ?)').get('Manager Approved', 'Final Audit Completed')).count;
  }

  const submissionScore = totalChecklists > 0 ? Math.min(100, submittedEvidence / (totalChecklists * totalUsers || 1) * 100) : 0;
  const approvalScore = submittedEvidence > 0 ? approvedEvidence / submittedEvidence * 100 : 0;
  const complianceScore = Math.round(submissionScore * 0.4 + approvalScore * 0.6);

  res.json({
    score: complianceScore,
    submissionScore: Math.round(submissionScore),
    approvalScore: Math.round(approvalScore),
    totalChecklists,
    submittedCount: submittedEvidence,
    approvedCount: approvedEvidence
  });
});

app.get('/api/analytics/department-comparison', authMiddleware, async (req, res) => {
  const departments = (await db.prepare('SELECT DISTINCT department FROM users').all()).map((u) => u.department);
  const result = await Promise.all(departments.map(async (dept) => {
    const totalChecklists = (await db.prepare('SELECT COUNT(*) as count FROM checklists WHERE department = ?').get(dept)).count;
    const totalUsers = (await db.prepare('SELECT COUNT(*) as count FROM users WHERE department = ? AND role IN (?, ?)').get(dept, 'Contributor', 'Team Lead')).count;
    const submitted = (await db.prepare('SELECT COUNT(DISTINCT checklistId || userId) as count FROM evidence WHERE department = ?').get(dept)).count;
    const approved = (await db.prepare('SELECT COUNT(*) as count FROM evidence WHERE department = ? AND status IN (?, ?)').get(dept, 'Manager Approved', 'Final Audit Completed')).count;
    const score = totalChecklists > 0 ? Math.round(submitted / (totalChecklists * totalUsers || 1) * 50 + (totalUsers > 0 ? (approved / submitted || 0) * 50 : 0)) : 0;
    return { department: dept, score, submitted, approved, totalUsers };
  }));
  res.json(result);
});

app.get('/api/analytics/anomalies', authMiddleware, async (req, res) => {
  const anomalies = [];

  const recurringFailures = await db.prepare(`
        SELECT userId, userName, COUNT(*) as count FROM evidence 
        WHERE status = 'Rejected' AND CAST(submittedAt AS timestamp) > NOW() - INTERVAL '7 days'
        GROUP BY userId, userName HAVING COUNT(*) >= 3
    `).all();

  if (recurringFailures.length > 0) {
    anomalies.push({ type: 'high_rejection', severity: 'warning', message: 'Users with 3+ rejections this week', data: recurringFailures });
  }

  const rapidSubmissions = await db.prepare(`
        SELECT userId, userName, COUNT(*) as count FROM evidence 
        WHERE CAST(submittedAt AS timestamp) > NOW() - INTERVAL '1 hour'
        GROUP BY userId, userName HAVING COUNT(*) > 10
    `).all();

  if (rapidSubmissions.length > 0) {
    anomalies.push({ type: 'rapid_submission', severity: 'info', message: 'Unusual submission volume detected', data: rapidSubmissions });
  }

  const pendingOld = (await db.prepare(`
        SELECT COUNT(*) as count FROM evidence 
        WHERE status = 'Submitted' AND CAST(submittedAt AS timestamp) < NOW() - INTERVAL '5 days'
    `).get()).count;

  if (pendingOld > 0) {
    anomalies.push({ type: 'pending_review', severity: 'warning', message: `${pendingOld} items pending review for 5+ days`, data: [] });
  }

  res.json(anomalies);
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

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('[SERVER ERROR]', err);
  });
}

module.exports = app;
app.db = db;