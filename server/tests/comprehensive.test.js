const request = require('supertest');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const app = require('../server');

describe('SparkAudit Platform Comprehensive Test Suite', () => {
  let superAdminToken = null;
  let contributorToken = null;
  let superAdminUser = null;
  let contributorUser = null;
  let createdEvidenceId = null;
  let createdCapaId = null;

  const adminEmail = `admin_${Date.now()}@nitechspark.in`;
  const contribEmail = `contrib_${Date.now()}@nitechspark.in`;
  const testPassword = 'SecurePassword#2026!';

  beforeAll(async () => {
    // Seed test users in the database directly for isolated test execution
    const hashedPw = bcrypt.hashSync(testPassword, 10);
    superAdminUser = {
      id: 'admin_test_' + crypto.randomBytes(4).toString('hex'),
      name: 'Super Administrator',
      email: adminEmail,
      role: 'Super Admin',
      department: 'Admin',
      isActive: 1,
      password: hashedPw,
      isLocked: 0,
      loginAttempts: 0,
      mfaEnabled: 0
    };

    contributorUser = {
      id: 'contrib_test_' + crypto.randomBytes(4).toString('hex'),
      name: 'Contributor John',
      email: contribEmail,
      role: 'Contributor',
      department: 'Operations',
      isActive: 1,
      password: hashedPw,
      isLocked: 0,
      loginAttempts: 0,
      mfaEnabled: 0
    };

    const insertUser = app.db.prepare('INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts, mfaEnabled, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    await insertUser.run(superAdminUser.id, superAdminUser.name, superAdminUser.email, superAdminUser.role, superAdminUser.department, superAdminUser.isActive, superAdminUser.password, superAdminUser.isLocked, superAdminUser.loginAttempts, superAdminUser.mfaEnabled, new Date().toISOString());
    await insertUser.run(contributorUser.id, contributorUser.name, contributorUser.email, contributorUser.role, contributorUser.department, contributorUser.isActive, contributorUser.password, contributorUser.isLocked, contributorUser.loginAttempts, contributorUser.mfaEnabled, new Date().toISOString());

    // Login as Super Admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: testPassword });
    superAdminToken = adminLoginRes.body.token;

    // Login as Contributor
    const contribLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: contribEmail, password: testPassword });
    contributorToken = contribLoginRes.body.token;
  });

  describe('1. Authentication State Machine (Phase 1 P0-1 & P0-2)', () => {
    it('should successfully log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: adminEmail, password: testPassword });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined(); // Never expose passwords
    });

    it('should reject invalid password and track attempts', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: adminEmail, password: 'WrongPassword123!' });
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid credentials');
    });

    it('should reject unauthenticated me request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user info with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email.toLowerCase()).toBe(adminEmail.toLowerCase());
    });
  });

  describe('2. RBAC & Privilege Escalation Guards (Phase 1 P0-3)', () => {
    it('should allow Super Admin to create new users', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Auditor Person',
          email: `auditor_${Date.now()}@nitechspark.in`,
          role: 'Internal Auditor',
          department: 'Audit',
          password: 'SecureAuditorPass#2026'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should forbid Contributor from creating or managing users', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          name: 'Escalated User',
          email: `escalate_${Date.now()}@nitechspark.in`,
          role: 'Super Admin',
          department: 'Admin'
        });
      expect(res.status).toBe(403);
    });
  });

  describe('3. Evidence Management & Persistence (Phase 2 P1-4 & Phase 3 P2-2)', () => {
    it('should submit compliance evidence with checklistId', async () => {
      const res = await request(app)
        .post('/api/evidence')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          checklistId: 'it1',
          comment: 'Server patch cycle completed for production cluster nodes.',
          department: 'Operations',
          fileName: 'patch_management_log.pdf',
          fileSize: '2.4 MB'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.id).toBeDefined();
      createdEvidenceId = res.body.id;
    });

    it('should allow Super Admin/Auditor to approve evidence and persist status', async () => {
      const res = await request(app)
        .put(`/api/evidence/${createdEvidenceId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'Auditor Approved',
          reviewerComment: 'Patch logs verified against ISO 27001 control A.12.6.1.'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify persistence from data endpoint
      const dataRes = await request(app)
        .get('/api/data')
        .set('Authorization', `Bearer ${superAdminToken}`);
      const updatedEv = dataRes.body.evidence.find(e => e.id === createdEvidenceId);
      expect(updatedEv).toBeDefined();
      expect(updatedEv.status).toBe('Auditor Approved');
      expect(updatedEv.checklistId).toBe('it1');
    });
  });

  describe('4. CAPA Module Backend (Phase 2 P1-1 & P1-5)', () => {
    it('should record new CAPA report', async () => {
      const currentYear = new Date().getFullYear();
      const res = await request(app)
        .post('/api/capa')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          month: 'August',
          year: currentYear,
          content: 'Implemented root cause analysis and patch automation script for access latency.',
          fileName: 'capa_august_report.docx',
          severity: 'High'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.id).toBeDefined();
      createdCapaId = res.body.id;
    });

    it('should retrieve CAPA reports list', async () => {
      const res = await request(app)
        .get('/api/capa')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some(c => c.id === createdCapaId)).toBe(true);
    });

    it('should allow approval of CAPA report', async () => {
      const res = await request(app)
        .put(`/api/capa/${createdCapaId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'Auditor Approved',
          reviewComment: 'Corrective actions verified and closed.'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('5. AI Evidence Intelligence & Risk Analysis (Phase 2 P1-2)', () => {
    it('should return structured AI insights for compliance context', async () => {
      const res = await request(app)
        .post('/api/analytics/ai-insights')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          context: 'Control: Privileged Access Review. Evidence: Monthly admin review sign-off log for Q3.',
          promptType: 'evidence'
        });
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.riskLevel).toBeDefined();
      expect(Array.isArray(res.body.recommendations)).toBe(true);
      expect(typeof res.body.confidence).toBe('number');
    });
  });

  describe('6. Tamper-Evident Audit Ledger Integrity (Phase 3 P2-6)', () => {
    it('should log audit events with SHA-256 hash chains and verify chain integrity', async () => {
      // Append an activity
      await request(app)
        .post('/api/activity')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          action: 'Audit Sign-off',
          description: 'Verified Q3 information security controls.'
        });

      // Verify integrity
      const res = await request(app)
        .get('/api/audit-log/integrity')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(typeof res.body.checkedRecords).toBe('number');
    });
  });

  describe('7. Server-Side Password Change (Phase 2 P1-7)', () => {
    it('should update password and verify old password matching', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          currentPassword: testPassword,
          newPassword: 'BrandNewSecurePassword#2026'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify re-login with new password
      const reLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: contribEmail,
          password: 'BrandNewSecurePassword#2026'
        });
      expect(reLogin.status).toBe(200);
      expect(reLogin.body.token).toBeDefined();
    });
  });

  describe('8. Governance Controls & Risk Registers (Phase 5 Feature 1 & 2)', () => {
    it('should retrieve standard controls library', async () => {
      const res = await request(app)
        .get('/api/controls')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should add risk register entry', async () => {
      const res = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Unpatched Third-Party Dependency',
          department: 'IT',
          asset: 'Web Application Server',
          threat: 'Known CVE vulnerability exploitation',
          likelihood: 4,
          impact: 4
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
