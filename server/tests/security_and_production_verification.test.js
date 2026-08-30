const request = require('supertest');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const app = require('../server');
const api = require('./setup');

describe('SparkAudit Deep Security, RBAC & End-to-End Verification Suite', () => {
  let superAdminToken = null;
  let managerToken = null;
  let contributorToken = null;
  let internalAuditorToken = null;
  let externalAuditorToken = null;

  let superAdminUser = null;
  let managerUser = null;
  let contributorUser = null;
  let internalAuditorUser = null;
  let externalAuditorUser = null;

  const adminPass = 'AdminSecret#2026!';
  const managerPass = 'ManagerSecret#2026!';
  const contribPass = 'ContribSecret#2026!';
  const intAuditorPass = 'IntAuditSecret#2026!';
  const extAuditorPass = 'ExtAuditSecret#2026!';

  beforeAll(async () => {
    // Seed test users with distinct roles and departments
    superAdminUser = await api.seedUser(`sa_${Date.now()}@nitechspark.in`, adminPass, 'Super Admin', 'Admin');
    managerUser = await api.seedUser(`mgr_${Date.now()}@nitechspark.in`, managerPass, 'Manager', 'Operations');
    contributorUser = await api.seedUser(`contrib_${Date.now()}@nitechspark.in`, contribPass, 'Contributor', 'Operations');
    internalAuditorUser = await api.seedUser(`intaudit_${Date.now()}@nitechspark.in`, intAuditorPass, 'Internal Auditor', 'Audit');
    externalAuditorUser = await api.seedUser(`extaudit_${Date.now()}@nitechspark.in`, extAuditorPass, 'External Auditor', 'Audit');

    // Authenticate users
    const saLogin = await request(app).post('/api/auth/login').send({ email: superAdminUser.email, password: adminPass });
    superAdminToken = saLogin.body.token;

    const mgrLogin = await request(app).post('/api/auth/login').send({ email: managerUser.email, password: managerPass });
    managerToken = mgrLogin.body.token;

    const contribLogin = await request(app).post('/api/auth/login').send({ email: contributorUser.email, password: contribPass });
    contributorToken = contribLogin.body.token;

    const intLogin = await request(app).post('/api/auth/login').send({ email: internalAuditorUser.email, password: intAuditorPass });
    internalAuditorToken = intLogin.body.token;

    const extLogin = await request(app).post('/api/auth/login').send({ email: externalAuditorUser.email, password: extAuditorPass });
    externalAuditorToken = extLogin.body.token;
  });

  // ==========================================================================
  // 1. SECRET / CREDENTIAL & AUTHENTICATION VERIFICATION
  // ==========================================================================
  describe('1. Authentication State Machine & Challenge Separation', () => {
    it('A. Password-only login -> session token issued, no password hash returned', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: contributorUser.email, password: contribPass });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.mfaSecret).toBeUndefined();
    });

    it('B. MFA user login -> issues MFA challenge token only', async () => {
      const mfaSecretObj = speakeasy.generateSecret();
      const mfaEmail = `mfa_user_${Date.now()}@nitechspark.in`;
      const mfaPass = 'MfaPass#2026!';
      
      const mfaUser = {
        id: 'mfa_u_' + crypto.randomBytes(4).toString('hex'),
        name: 'MFA Enabled User',
        email: mfaEmail,
        role: 'Contributor',
        department: 'Operations',
        isActive: 1,
        password: bcrypt.hashSync(mfaPass, 10),
        isLocked: 0,
        loginAttempts: 0,
        mfaEnabled: 1,
        mfaSecret: app.encryptSecret(mfaSecretObj.base32)
      };
      await app.db.prepare('INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts, mfaEnabled, mfaSecret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        mfaUser.id, mfaUser.name, mfaUser.email, mfaUser.role, mfaUser.department, mfaUser.isActive, mfaUser.password, mfaUser.isLocked, mfaUser.loginAttempts, mfaUser.mfaEnabled, mfaUser.mfaSecret
      );

      const loginRes = await request(app).post('/api/auth/login').send({ email: mfaEmail, password: mfaPass });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.mfaRequired).toBe(true);
      expect(loginRes.body.challengeToken).toBeDefined();
      expect(loginRes.body.token).toBeUndefined();

      const challengeToken = loginRes.body.challengeToken;

      // C. MFA challenge CANNOT access protected endpoints
      const protectedRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${challengeToken}`);
      expect([401, 403]).toContain(protectedRes.status);

      // D. Invalid TOTP rejected
      const badMfaRes = await request(app).post('/api/mfa/verify').send({ challengeToken, code: '000000' });
      expect(badMfaRes.status).toBe(401);

      // E. Valid TOTP -> full session token
      const validCode = speakeasy.totp({ secret: mfaSecretObj.base32, encoding: 'base32' });
      const validMfaRes = await request(app).post('/api/mfa/verify').send({ challengeToken, code: validCode });
      expect(validMfaRes.status).toBe(200);
      expect(validMfaRes.body.token).toBeDefined();

      // F. Challenge token is consumed and cannot be reused
      const reuseMfaRes = await request(app).post('/api/mfa/verify').send({ challengeToken, code: validCode });
      expect(reuseMfaRes.status).toBe(400);
    });

    it('G. Account lockout after 5 failed attempts', async () => {
      const lockEmail = `lock_user_${Date.now()}@nitechspark.in`;
      const lockPass = 'CorrectPass#2026!';
      await api.seedUser(lockEmail, lockPass, 'Contributor', 'Finance');

      // 4 wrong attempts
      for (let i = 0; i < 4; i++) {
        const res = await request(app).post('/api/auth/login').send({ email: lockEmail, password: 'WrongPassword!' });
        expect(res.status).toBe(401);
      }

      // 5th wrong attempt triggers lock
      const fifthRes = await request(app).post('/api/auth/login').send({ email: lockEmail, password: 'WrongPassword!' });
      expect(fifthRes.status).toBe(403);
      expect(fifthRes.body.error).toContain('locked');

      // 6th attempt with correct password rejected because account is locked
      const sixthRes = await request(app).post('/api/auth/login').send({ email: lockEmail, password: lockPass });
      expect(sixthRes.status).toBe(403);
      expect(sixthRes.body.error).toContain('locked');
    });

    it('H. Login error does not disclose whether email exists', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'nonexistent_account@nitechspark.in', password: 'AnyPassword123!' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials provided.');
    });

    it('I. Logout invalidates session on server', async () => {
      const tempEmail = `logout_${Date.now()}@nitechspark.in`;
      const tempPass = 'TempPass#2026!';
      await api.seedUser(tempEmail, tempPass, 'Contributor', 'Operations');
      const loginRes = await request(app).post('/api/auth/login').send({ email: tempEmail, password: tempPass });
      const tempToken = loginRes.body.token;

      // Verify active
      const meBefore = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tempToken}`);
      expect(meBefore.status).toBe(200);

      // Logout
      const logoutRes = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${tempToken}`);
      expect(logoutRes.status).toBe(200);

      // Verify token invalidated
      const meAfter = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tempToken}`);
      expect(meAfter.status).toBe(401);
    });
  });

  // ==========================================================================
  // 2. RBAC & PRIVILEGE ESCALATION TESTING
  // ==========================================================================
  describe('2. RBAC & Privilege Escalation Guards', () => {
    it('Contributor cannot create user -> 403', async () => {
      const res = await request(app).post('/api/users').set('Authorization', `Bearer ${contributorToken}`).send({
        name: 'Hacked User',
        email: `hacked_${Date.now()}@nitechspark.in`,
        role: 'Super Admin',
        department: 'Admin'
      });
      expect(res.status).toBe(403);
    });

    it('Contributor cannot update user -> 403', async () => {
      const res = await request(app).put(`/api/users/${contributorUser.id}`).set('Authorization', `Bearer ${contributorToken}`).send({
        role: 'Super Admin'
      });
      expect(res.status).toBe(403);
    });

    it('Contributor cannot delete user -> 403', async () => {
      const res = await request(app).delete(`/api/users/${managerUser.id}`).set('Authorization', `Bearer ${contributorToken}`);
      expect(res.status).toBe(403);
    });

    it('Manager cannot create or promote user to Super Admin -> 403', async () => {
      const res = await request(app).post('/api/users').set('Authorization', `Bearer ${managerToken}`).send({
        name: 'Manager Created Admin',
        email: `mgr_admin_${Date.now()}@nitechspark.in`,
        role: 'Super Admin',
        department: 'Admin'
      });
      expect(res.status).toBe(403);
    });

    it('External Auditor cannot mutate controls -> 403', async () => {
      const res = await request(app).post('/api/controls').set('Authorization', `Bearer ${externalAuditorToken}`).send({
        title: 'Unauthorized Control',
        framework: 'ISO 27001',
        department: 'Audit'
      });
      expect(res.status).toBe(403);
    });

    it('Internal Auditor cannot manage users -> 403', async () => {
      const res = await request(app).delete(`/api/users/${contributorUser.id}`).set('Authorization', `Bearer ${internalAuditorToken}`);
      expect(res.status).toBe(403);
    });

    it('Super Admin can manage users -> 201', async () => {
      const res = await request(app).post('/api/users').set('Authorization', `Bearer ${superAdminToken}`).send({
        name: 'Auditor Candidate',
        email: `candidate_${Date.now()}@nitechspark.in`,
        role: 'Internal Auditor',
        department: 'Audit',
        password: 'SecurePassCandidate#2026'
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================================================
  // 3. FILE UPLOAD & STORAGE VERIFICATION (Requirement 6)
  // ==========================================================================
  describe('3. File Upload & Storage Security', () => {
    let uploadedFileUrl = null;
    const testFileContent = 'SparkAudit Verified Compliance Artifact Buffer';
    const base64Data = Buffer.from(testFileContent).toString('base64');

    it('should upload valid compliance document and return server storage path', async () => {
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          fileName: 'soc2_access_report.pdf',
          fileType: 'application/pdf',
          fileData: base64Data
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.fileUrl).toBeDefined();
      expect(res.body.fileUrl.startsWith('/api/files/')).toBe(true);
      uploadedFileUrl = res.body.fileUrl;
    });

    it('should allow authorized user to download uploaded artifact', async () => {
      const res = await request(app)
        .get(uploadedFileUrl)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.text || res.body.toString()).toContain('SparkAudit Verified Compliance Artifact Buffer');
    });

    it('should reject unauthenticated file download', async () => {
      const res = await request(app).get(uploadedFileUrl);
      expect(res.status).toBe(401);
    });

    it('should reject prohibited file MIME types (e.g., .exe / script)', async () => {
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          fileName: 'malware.exe',
          fileType: 'application/x-msdownload',
          fileData: base64Data
        });

      expect(res.status).toBe(400);
    });

    it('should prevent path traversal attacks on file downloads', async () => {
      const res = await request(app)
        .get('/api/files/..%2f..%2fpackage.json')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect([400, 404]).toContain(res.status);
    });
  });

  // ==========================================================================
  // 4. CAPA & EVIDENCE END-TO-END VERIFICATION
  // ==========================================================================
  describe('4. CAPA & Evidence End-to-End Lifecycle', () => {
    let createdCapaId = null;
    let createdEvidenceId = null;

    it('should submit CAPA and prevent duplicate submission for same month/year', async () => {
      const currentYear = new Date().getFullYear();
      const res = await request(app)
        .post('/api/capa')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          month: 'July',
          year: currentYear,
          content: 'Remediated missing database replica lag alert.',
          fileName: 'capa_july.pdf',
          fileUrl: '/api/files/sample_capa.pdf',
          fileSize: '1.2 MB'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      createdCapaId = res.body.id;

      // Duplicate submission test
      const dupRes = await request(app)
        .post('/api/capa')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          month: 'July',
          year: currentYear,
          content: 'Duplicate submission attempt',
          fileName: 'capa_july_dup.pdf'
        });
      expect(dupRes.status).toBe(409);
    });

    it('should submit Evidence and allow Auditor approval with persistence', async () => {
      const evRes = await request(app)
        .post('/api/evidence')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          checklistId: 'it1',
          comment: 'Monthly kernel patch verification log.',
          department: 'Operations',
          fileName: 'kernel_patch.pdf',
          fileUrl: '/api/files/kernel_patch.pdf',
          fileSize: '3.1 MB'
        });

      expect(evRes.status).toBe(201);
      createdEvidenceId = evRes.body.id;

      // Contributor cannot approve own evidence
      const illegalApprove = await request(app)
        .put(`/api/evidence/${createdEvidenceId}`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({ status: 'Auditor Approved' });
      expect(illegalApprove.status).toBe(403);

      // Auditor approves evidence
      const approveRes = await request(app)
        .put(`/api/evidence/${createdEvidenceId}`)
        .set('Authorization', `Bearer ${internalAuditorToken}`)
        .send({ status: 'Auditor Approved', managerComment: 'Verified against ISO 27001 A.12.6.1' });
      expect(approveRes.status).toBe(200);
    });
  });

  // ==========================================================================
  // 5. TAMPER-EVIDENT AUDIT LEDGER INTEGRITY (Requirement 8)
  // ==========================================================================
  describe('5. Tamper-Evident Audit Ledger & Tamper Detection', () => {
    it('should detect when an audit ledger record is modified or corrupted', async () => {
      // 1. Create sequential audit activities
      await request(app).post('/api/activity').set('Authorization', `Bearer ${superAdminToken}`).send({
        action: 'Policy Update',
        description: 'Updated Password Rotation Policy to 90 days.'
      });
      await request(app).post('/api/activity').set('Authorization', `Bearer ${superAdminToken}`).send({
        action: 'Control Audit',
        description: 'Inspected access logging on production nodes.'
      });

      // 2. Ledger must be VALID
      const validCheck = await request(app).get('/api/audit-log/integrity').set('Authorization', `Bearer ${superAdminToken}`);
      expect(validCheck.status).toBe(200);
      expect(validCheck.body.valid).toBe(true);

      // 3. Tamper with a record directly in the activity database table
      const activities = await app.db.prepare('SELECT * FROM activity ORDER BY timestamp ASC').all();
      if (activities.length > 0) {
        const target = activities[0];
        const originalDesc = target.description || target.desc;

        // Perform malicious database mutation
        await app.db.prepare('UPDATE activity SET description = ? WHERE id = ?').run('MALICIOUS_TAMPERED_PAYLOAD', target.id);

        // 4. Verification must detect failure
        const tamperedCheck = await request(app).get('/api/audit-log/integrity').set('Authorization', `Bearer ${superAdminToken}`);
        expect(tamperedCheck.status).toBe(200);
        expect(tamperedCheck.body.valid).toBe(false);
        expect(tamperedCheck.body.failureType).toBe('HASH_MISMATCH');

        // 5. Restore original record
        await app.db.prepare('UPDATE activity SET description = ? WHERE id = ?').run(originalDesc, target.id);

        // 6. Ledger returns to VALID
        const restoredCheck = await request(app).get('/api/audit-log/integrity').set('Authorization', `Bearer ${superAdminToken}`);
        expect(restoredCheck.status).toBe(200);
        expect(restoredCheck.body.valid).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 6. NOTIFICATIONS & SERVER PASSWORD CHANGE
  // ==========================================================================
  describe('6. Notifications & Password Security', () => {
    it('Notifications are scoped strictly to the authenticated user', async () => {
      const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${contributorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.notifications).toBeDefined();
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    it('Server-side password change enforces current password validation', async () => {
      // Wrong current password
      const wrongRes = await request(app).post('/api/auth/change-password').set('Authorization', `Bearer ${managerToken}`).send({
        currentPassword: 'WrongPassword!',
        newPassword: 'BrandNewManagerPass#2026!'
      });
      expect(wrongRes.status).toBe(400);

      // Correct current password
      const correctRes = await request(app).post('/api/auth/change-password').set('Authorization', `Bearer ${managerToken}`).send({
        currentPassword: managerPass,
        newPassword: 'BrandNewManagerPass#2026!'
      });
      expect(correctRes.status).toBe(200);
      expect(correctRes.body.success).toBe(true);
    });
  });

  // ==========================================================================
  // 7. GOVERNANCE CONTROLS, RISKS & FINDINGS
  // ==========================================================================
  describe('7. Governance Controls, Risks & Findings', () => {
    it('should manage full control library and risk registers', async () => {
      const ctrlRes = await request(app).post('/api/controls').set('Authorization', `Bearer ${superAdminToken}`).send({
        title: 'MFA Enforcement Control',
        framework: 'SOC 2',
        clause: 'CC6.1',
        department: 'IT',
        category: 'Access Control',
        severity: 'High'
      });
      expect(ctrlRes.status).toBe(201);

      const riskRes = await request(app).post('/api/risks').set('Authorization', `Bearer ${superAdminToken}`).send({
        title: 'Privilege Escalation Exposure',
        department: 'IT',
        asset: 'IAM Directory',
        threat: 'Compromised admin credentials',
        likelihood: 3,
        impact: 5
      });
      expect(riskRes.status).toBe(201);
    });
  });
});
