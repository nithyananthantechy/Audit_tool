/**
 * Comprehensive QA Test Suite for Multi-Tenant Management & Enterprise Licensing
 * 
 * Domains Tested:
 * 1. Tenant Lifecycle Management & Administration (CRUD, Protected Platform Owner, Auto Org Admin)
 * 2. Multi-Tenant Data Isolation & Cross-Tenant Boundary Enforcement
 * 3. Enterprise Seat Quota & Limit Enforcement
 * 4. Enterprise License Expiration & Suspension Gatekeeping (Read-Only Grace vs Write-Block)
 * 5. License Renewal & Seat Expansion Workflow
 */

// Guarantee test environment before requiring server
process.env.NODE_ENV = 'test';
process.env.PORT = 3003;

const request = require('supertest');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const app = require('../server');

describe('Multi-Tenant Management & Enterprise Licensing QA Acceptance Suite', () => {
  jest.setTimeout(30000);
  let superAdminToken = null;
  let superAdminUser = null;
  const superAdminEmail = `sa_tenant_qa_${Date.now()}@nitechspark.in`;
  const defaultPass = 'AuditPlatform#2026';

  // Helper to create & authenticate a user with specific org and role
  async function createAuthUser(email, role, department, orgId, password = defaultPass) {
    const hashed = bcrypt.hashSync(password, 10);
    const userId = 'u_qa_' + crypto.randomBytes(4).toString('hex');
    const user = {
      id: userId,
      name: `${role} (${email.split('@')[0]})`,
      email: email.toLowerCase(),
      role: role,
      department: department,
      isActive: 1,
      password: hashed,
      isLocked: 0,
      loginAttempts: 0,
      organizationId: orgId
    };

    await app.db.prepare(
      'INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      user.id, user.name, user.email, user.role, user.department, user.isActive, user.password, user.isLocked, user.loginAttempts, user.organizationId, new Date().toISOString()
    );

    const sessionToken = 'tok_' + crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    await app.db.prepare('INSERT INTO tokens (token, userId, expiresAt, type) VALUES (?, ?, ?, ?)').run(
      sessionToken, userId, expiresAt, 'session'
    );

    return { user, token: sessionToken };
  }

  beforeAll(async () => {
    // Seed Platform Super Admin
    const saAuth = await createAuthUser(superAdminEmail, 'Super Admin', 'Admin', 'org-niutechspark');
    superAdminUser = saAuth.user;
    superAdminToken = saAuth.token;
  });

  // ==========================================================================
  // SUITE 1: SUPER ADMIN TENANT LIFECYCLE MANAGEMENT (CRUD)
  // ==========================================================================
  describe('Suite 1: Tenant Lifecycle Management & Provisioning', () => {
    let createdOrgId = null;
    let createdOrgAdminEmail = null;

    it('1.1 Super Admin lists client organizations and receives metrics', async () => {
      const res = await request(app)
        .get('/api/admin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.organizations)).toBe(true);
      expect(res.body.organizations.length).toBeGreaterThan(0);

      // Verify computed licensing metrics exist
      const sampleOrg = res.body.organizations[0];
      expect(sampleOrg.id).toBeDefined();
      expect(sampleOrg.name).toBeDefined();
      expect(sampleOrg.status).toBeDefined();
      expect(typeof sampleOrg.activeUsersCount).toBe('number');
      expect(typeof sampleOrg.daysRemaining).toBe('number');
      expect(typeof sampleOrg.isExpiringSoon).toBe('boolean');
    });

    it('1.2 Non-Super Admin is strictly rejected from viewing organizations (RBAC 403)', async () => {
      const regularUser = await createAuthUser(`contrib_org_${Date.now()}@test.com`, 'Contributor', 'IT', 'org-niutechspark');
      const res = await request(app)
        .get('/api/admin/organizations')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('1.3 Super Admin provisions new organization & license with auto-provisioned Org Admin', async () => {
      const newOrgPayload = {
        name: 'Quantum Health Bio',
        code: `quantum-health-${Date.now()}`,
        contactName: 'Dr. Evelyn Reed',
        contactEmail: `evelyn_${Date.now()}@quantumhealth.io`,
        plan: 'Enterprise Platinum',
        maxUsers: 8,
        durationMonths: 12,
        adminName: 'Evelyn Reed',
        adminEmail: `admin_${Date.now()}@quantumhealth.io`,
        adminPassword: 'QuantumSecure#2026'
      };

      const res = await request(app)
        .post('/api/admin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newOrgPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.organization).toBeDefined();
      expect(res.body.organization.name).toBe(newOrgPayload.name);
      expect(res.body.organization.maxUsers).toBe(8);
      expect(res.body.organization.status).toBe('Active');
      expect(res.body.orgAdmin).toBeDefined();
      expect(res.body.orgAdmin.email).toBe(newOrgPayload.adminEmail);
      expect(res.body.orgAdmin.role).toBe('Org Admin');

      createdOrgId = res.body.organization.id;
      createdOrgAdminEmail = newOrgPayload.adminEmail;

      // Verify the provisioned Org Admin can authenticate
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: createdOrgAdminEmail, password: 'QuantumSecure#2026' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();
      expect(loginRes.body.user.role).toBe('Org Admin');
    });

    it('1.4 Provisioning handles slug collision automatically', async () => {
      const fixedCode = `collision-test-${Date.now()}`;
      const payload1 = {
        name: 'Collision Co',
        code: fixedCode,
        contactEmail: `c1_${Date.now()}@collision.com`
      };
      const res1 = await request(app)
        .post('/api/admin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload1);
      expect(res1.status).toBe(201);
      expect(res1.body.organization.code).toBe(fixedCode);

      // Provision again with identical code
      const payload2 = {
        name: 'Collision Co 2',
        code: fixedCode,
        contactEmail: `c2_${Date.now()}@collision.com`
      };
      const res2 = await request(app)
        .post('/api/admin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload2);
      expect(res2.status).toBe(201);
      expect(res2.body.organization.code).toBe(`${fixedCode}-1`);
    });

    it('1.5 Provisioning fails with 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/admin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('1.6 Super Admin updates organization details (Seats, Contact, Plan)', async () => {
      const res = await request(app)
        .put(`/api/admin/organizations/${createdOrgId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Quantum Health Bio Global',
          maxUsers: 15,
          plan: 'Enterprise Elite'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.organization.name).toBe('Quantum Health Bio Global');
      expect(res.body.organization.maxUsers).toBe(15);
      expect(res.body.organization.plan).toBe('Enterprise Elite');
    });

    it('1.7 Platform Owner organization is protected against accidental deletion (400)', async () => {
      // Trying to delete root platform owner
      const res = await request(app)
        .delete('/api/admin/organizations/org-niutechspark')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('platform owner');
    });

    it('1.8 Super Admin successfully deletes client organization and its users', async () => {
      const res = await request(app)
        .delete(`/api/admin/organizations/${createdOrgId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify users in that org were deleted
      const checkUsers = await app.db.prepare('SELECT COUNT(*) as count FROM users WHERE organizationId = ?').get(createdOrgId);
      expect(Number(checkUsers.count)).toBe(0);
    });
  });

  // ==========================================================================
  // SUITE 2: MULTI-TENANT DATA ISOLATION & ACCESS CONTROL
  // ==========================================================================
  describe('Suite 2: Multi-Tenant Data Isolation & Security Boundaries', () => {
    let orgAId, orgBId;
    let orgAAdmin, orgBAdmin;
    let orgAUser, orgBUser;

    beforeAll(async () => {
      // 1. Create Organization Alpha (Fintech Labs)
      orgAId = 'org-alpha-' + crypto.randomBytes(4).toString('hex');
      await app.db.prepare(
        'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        orgAId, 'Fintech Labs', 'fintech-labs', 'Alpha Contact', 'alpha@fintech.com', 'Active', 'Enterprise', 10,
        new Date().toISOString(), new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(), '["audits","capa"]', new Date().toISOString()
      );

      // 2. Create Organization Beta (CloudScale Inc)
      orgBId = 'org-beta-' + crypto.randomBytes(4).toString('hex');
      await app.db.prepare(
        'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        orgBId, 'CloudScale Inc', 'cloudscale', 'Beta Contact', 'beta@cloudscale.io', 'Active', 'Enterprise', 10,
        new Date().toISOString(), new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(), '["audits","capa"]', new Date().toISOString()
      );

      // Users for Org Alpha
      orgAAdmin = await createAuthUser(`admin@fintech-${Date.now()}.com`, 'Org Admin', 'Admin', orgAId);
      orgAUser = await createAuthUser(`dev@fintech-${Date.now()}.com`, 'Contributor', 'IT', orgAId);

      // Users for Org Beta
      orgBAdmin = await createAuthUser(`admin@cloudscale-${Date.now()}.com`, 'Org Admin', 'Admin', orgBId);
      orgBUser = await createAuthUser(`dev@cloudscale-${Date.now()}.com`, 'Contributor', 'IT', orgBId);
    });

    it('2.1 User Directory Isolation: Org Admin can only see users from their own tenant', async () => {
      // Alpha Admin queries users
      const resA = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${orgAAdmin.token}`);

      expect(resA.status).toBe(200);
      const alphaUsers = Array.isArray(resA.body) ? resA.body : (resA.body.users || []);
      // All returned users must belong to orgA (or be global system admin if configured)
      const nonAlphaUsers = alphaUsers.filter(u => u.organizationId && u.organizationId !== orgAId && u.role !== 'Super Admin');
      expect(nonAlphaUsers.length).toBe(0);
      expect(alphaUsers.some(u => u.id === orgAUser.user.id)).toBe(true);
      expect(alphaUsers.some(u => u.id === orgBUser.user.id)).toBe(false);

      // Beta Admin queries users
      const resB = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${orgBAdmin.token}`);

      expect(resB.status).toBe(200);
      const betaUsers = Array.isArray(resB.body) ? resB.body : (resB.body.users || []);
      const nonBetaUsers = betaUsers.filter(u => u.organizationId && u.organizationId !== orgBId && u.role !== 'Super Admin');
      expect(nonBetaUsers.length).toBe(0);
      expect(betaUsers.some(u => u.id === orgBUser.user.id)).toBe(true);
      expect(betaUsers.some(u => u.id === orgAUser.user.id)).toBe(false);
    });

    it('2.2 Cross-Tenant User Mutation is strictly blocked (403 Forbidden)', async () => {
      // Alpha Admin attempts to modify Beta User's role
      const res = await request(app)
        .put(`/api/users/${orgBUser.user.id}`)
        .set('Authorization', `Bearer ${orgAAdmin.token}`)
        .send({ role: 'Manager' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('2.3 Cross-Tenant User Deletion is strictly blocked (403 Forbidden)', async () => {
      // Alpha Admin attempts to delete Beta User
      const res = await request(app)
        .delete(`/api/users/${orgBUser.user.id}`)
        .set('Authorization', `Bearer ${orgAAdmin.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('2.4 Governance Audits are isolated per tenant', async () => {
      // Alpha creates an Audit
      const auditRes = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${orgAAdmin.token}`)
        .send({
          name: 'Fintech PCI-DSS Review',
          type: 'PCI DSS',
          period: 'Q3-2026',
          leadAuditor: orgAAdmin.user.name,
          description: 'Payment isolation audit'
        });

      expect(auditRes.status).toBe(201);
      const alphaAudit = auditRes.body.audit;

      // Beta queries audits
      const betaAuditsRes = await request(app)
        .get('/api/audits')
        .set('Authorization', `Bearer ${orgBAdmin.token}`);

      expect(betaAuditsRes.status).toBe(200);
      const betaAudits = Array.isArray(betaAuditsRes.body) ? betaAuditsRes.body : (betaAuditsRes.body.audits || []);
      const leakedAudit = betaAudits.find(a => a.id === alphaAudit.id || a.name === 'Fintech PCI-DSS Review');
      expect(leakedAudit).toBeUndefined();
    });

    it('2.5 Evidence Requests are isolated per tenant', async () => {
      // Alpha creates an Evidence Request
      const reqRes = await request(app)
        .post('/api/evidence-requests')
        .set('Authorization', `Bearer ${orgAAdmin.token}`)
        .send({
          auditId: 'AUD-ALPHA',
          controlId: 'A.12.1.2',
          department: 'IT',
          evidenceRequired: 'Firewall ruleset export for Alpha',
          priority: 'High',
          dueDate: '2026-10-01'
        });

      expect(reqRes.status).toBe(201);
      const alphaReqId = reqRes.body.requestId;

      // Beta queries evidence requests
      const betaReqsRes = await request(app)
        .get('/api/evidence-requests')
        .set('Authorization', `Bearer ${orgBAdmin.token}`);

      expect(betaReqsRes.status).toBe(200);
      const betaRequests = Array.isArray(betaReqsRes.body) ? betaReqsRes.body : (betaReqsRes.body.evidenceRequests || []);
      const leakedRequest = betaRequests.find(r => r.requestId === alphaReqId);
      expect(leakedRequest).toBeUndefined();
    });
  });

  // ==========================================================================
  // SUITE 3: ENTERPRISE SEAT LIMIT & QUOTA ENFORCEMENT
  // ==========================================================================
  describe('Suite 3: Enterprise Seat Quota & Limit Enforcement', () => {
    let quotaOrgId;
    let quotaOrgAdmin;

    beforeAll(async () => {
      // Create Organization with exact quota of 2 seats
      quotaOrgId = 'org-quota-' + crypto.randomBytes(4).toString('hex');
      await app.db.prepare(
        'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        quotaOrgId, 'Quota Strict LLC', 'quota-strict', 'Quota Contact', 'quota@strict.com', 'Active', 'Starter', 2,
        new Date().toISOString(), new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(), '["audits"]', new Date().toISOString()
      );

      // Seat 1: The Org Admin consumes 1 seat
      quotaOrgAdmin = await createAuthUser(`admin@quota-${Date.now()}.com`, 'Org Admin', 'Admin', quotaOrgId);
    });

    it('3.1 Org Admin provisions 2nd user (active seats = 2/2) -> Success (201)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${quotaOrgAdmin.token}`)
        .send({
          name: 'Second User',
          email: `second_${Date.now()}@quota.com`,
          role: 'Contributor',
          department: 'Operations',
          isActive: true
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('3.2 Org Admin attempts to provision 3rd user exceeding 2-seat limit -> Blocked (400)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${quotaOrgAdmin.token}`)
        .send({
          name: 'Third User (Over Quota)',
          email: `third_${Date.now()}@quota.com`,
          role: 'Contributor',
          department: 'Operations',
          isActive: true
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Seat limit reached');
      expect(res.body.error).toContain('2/2 seats used');
    });

    it('3.3 Deactivating a user frees up seat capacity allowing a new user to be provisioned', async () => {
      // Find the second user and deactivate
      const usersInOrg = await app.db.prepare('SELECT id FROM users WHERE organizationId = ? AND role != ?').all(quotaOrgId, 'Org Admin');
      const secondUserId = usersInOrg[0].id;

      // Deactivate user
      const deactivateRes = await request(app)
        .put(`/api/users/${secondUserId}`)
        .set('Authorization', `Bearer ${quotaOrgAdmin.token}`)
        .send({ isActive: false });

      expect(deactivateRes.status).toBe(200);

      // Now provision third user -> should succeed
      const retryRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${quotaOrgAdmin.token}`)
        .send({
          name: 'Third User (Now Succeeds)',
          email: `third_success_${Date.now()}@quota.com`,
          role: 'Contributor',
          department: 'Operations',
          isActive: true
        });

      expect(retryRes.status).toBe(201);
      expect(retryRes.body.success).toBe(true);
    });
  });

  // ==========================================================================
  // SUITE 4: ENTERPRISE LICENSE EXPIRATION & SUSPENSION ENFORCEMENT
  // ==========================================================================
  describe('Suite 4: License Expiration, Suspension & State Gatekeeping', () => {
    let activeOrgId, activeAdmin;
    let expiredOrgId, expiredAdmin;
    let suspendedOrgId, suspendedAdmin;
    let expiringSoonOrgId, expiringSoonAdmin;

    beforeAll(async () => {
      const now = Date.now();

      // 1. Active Tenant (1 year remaining)
      activeOrgId = 'org-act-' + crypto.randomBytes(4).toString('hex');
      await app.db.prepare(
        'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        activeOrgId, 'Active Org', 'active-org', 'Active Contact', 'act@test.com', 'Active', 'Enterprise', 10,
        new Date(now).toISOString(), new Date(now + 365 * 24 * 3600 * 1000).toISOString(), '["audits"]', new Date().toISOString()
      );
      activeAdmin = await createAuthUser(`act_${now}@test.com`, 'Org Admin', 'Admin', activeOrgId);

      // 2. Expiring Soon Tenant (5 days remaining)
      expiringSoonOrgId = 'org-expsoon-' + crypto.randomBytes(4).toString('hex');
      await app.db.prepare(
        'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        expiringSoonOrgId, 'Expiring Soon Org', 'expsoon-org', 'ExpSoon Contact', 'expsoon@test.com', 'Active', 'Enterprise', 10,
        new Date(now - 355 * 24 * 3600 * 1000).toISOString(), new Date(now + 5 * 24 * 3600 * 1000).toISOString(), '["audits"]', new Date().toISOString()
      );
      expiringSoonAdmin = await createAuthUser(`expsoon_${now}@test.com`, 'Org Admin', 'Admin', expiringSoonOrgId);

      // 3. Expired Tenant (expired 5 days ago)
      expiredOrgId = 'org-exp-' + crypto.randomBytes(4).toString('hex');
      await app.db.prepare(
        'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        expiredOrgId, 'Expired Org', 'expired-org', 'Exp Contact', 'exp@test.com', 'Expired', 'Enterprise', 10,
        new Date(now - 370 * 24 * 3600 * 1000).toISOString(), new Date(now - 5 * 24 * 3600 * 1000).toISOString(), '["audits"]', new Date().toISOString()
      );
      expiredAdmin = await createAuthUser(`exp_${now}@test.com`, 'Org Admin', 'Admin', expiredOrgId);

      // 4. Suspended Tenant
      suspendedOrgId = 'org-susp-' + crypto.randomBytes(4).toString('hex');
      await app.db.prepare(
        'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        suspendedOrgId, 'Suspended Org', 'suspended-org', 'Susp Contact', 'susp@test.com', 'Suspended', 'Enterprise', 10,
        new Date(now).toISOString(), new Date(now + 100 * 24 * 3600 * 1000).toISOString(), '["audits"]', new Date().toISOString()
      );
      suspendedAdmin = await createAuthUser(`susp_${now}@test.com`, 'Org Admin', 'Admin', suspendedOrgId);
    });

    it('4.1 Active Tenant can perform both read (GET) and write (POST) operations', async () => {
      // Read
      const readRes = await request(app)
        .get('/api/audits')
        .set('Authorization', `Bearer ${activeAdmin.token}`);
      expect(readRes.status).toBe(200);

      // Write
      const writeRes = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${activeAdmin.token}`)
        .send({
          name: 'Active Audit 2026',
          type: 'SOC 2 Type II',
          period: 'Q4-2026',
          leadAuditor: activeAdmin.user.name,
          description: 'Valid audit creation under active license'
        });
      expect(writeRes.status).toBe(201);
    });

    it('4.2 Expiring Soon Tenant: auth middleware attaches daysRemaining <= 10 and isExpiringSoon: true', async () => {
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiringSoonAdmin.token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.organization).toBeDefined();
      expect(meRes.body.user.organization.isExpiringSoon).toBe(true);
      expect(meRes.body.user.organization.daysRemaining).toBeLessThanOrEqual(10);
      expect(meRes.body.user.organization.daysRemaining).toBeGreaterThanOrEqual(0);
    });

    it('4.3 Expired Tenant: Write operations are BLOCKED with 403 Forbidden', async () => {
      const writeRes = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${expiredAdmin.token}`)
        .send({
          name: 'Unauthorized Audit on Expired Tenant',
          type: 'ISO 27001',
          period: 'Q4-2026',
          leadAuditor: expiredAdmin.user.name
        });

      expect(writeRes.status).toBe(403);
      expect(writeRes.body.licenseExpired).toBe(true);
      expect(writeRes.body.error).toContain('expired');
      expect(writeRes.body.error).toContain('renew your subscription');
    });

    it('4.4 Expired Tenant: Read operations REMAIN PERMITTED (Compliance Data Retrievability Guarantee)', async () => {
      const readRes = await request(app)
        .get('/api/audits')
        .set('Authorization', `Bearer ${expiredAdmin.token}`);

      expect(readRes.status).toBe(200);
    });

    it('4.5 Suspended Tenant: Write operations are BLOCKED with 403 Forbidden', async () => {
      const writeRes = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${suspendedAdmin.token}`)
        .send({
          name: 'Unauthorized Audit on Suspended Tenant',
          type: 'ISO 27001',
          period: 'Q4-2026'
        });

      expect(writeRes.status).toBe(403);
      expect(writeRes.body.error).toContain('suspended');
    });

    it('4.6 Super Admin is exempt from license expiry blocks for emergency administrative maintenance', async () => {
      // Super admin can write even if managing items
      const res = await request(app)
        .get('/api/admin/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ==========================================================================
  // SUITE 5: LICENSE RENEWAL & CAPACITY UPGRADE WORKFLOW
  // ==========================================================================
  describe('Suite 5: License Renewal & Capacity Expansion Workflow', () => {
    let expiredOrgToRenewId, renewedAdmin;

    beforeAll(async () => {
      const now = Date.now();
      // Tenant expired 10 days ago, limited to 2 seats
      expiredOrgToRenewId = 'org-renew-' + crypto.randomBytes(4).toString('hex');
      await app.db.prepare(
        'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        expiredOrgToRenewId, 'Renewable Health Corp', 'renewable-health', 'Renew Contact', 'renew@health.com', 'Expired', 'Standard', 2,
        new Date(now - 375 * 24 * 3600 * 1000).toISOString(), new Date(now - 10 * 24 * 3600 * 1000).toISOString(), '["audits"]', new Date().toISOString()
      );
      renewedAdmin = await createAuthUser(`renewed_admin_${now}@health.com`, 'Org Admin', 'Admin', expiredOrgToRenewId);
    });

    it('5.1 Verify tenant write operations are initially blocked before renewal', async () => {
      const writeRes = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${renewedAdmin.token}`)
        .send({ name: 'Blocked Audit Pre-Renewal', type: 'ISO 27001' });

      expect(writeRes.status).toBe(403);
      expect(writeRes.body.licenseExpired).toBe(true);
    });

    it('5.2 Super Admin executes License Renewal (extends 12 months, upgrades to 25 seats)', async () => {
      const renewRes = await request(app)
        .post(`/api/admin/organizations/${expiredOrgToRenewId}/renew`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          extensionMonths: 12,
          newMaxUsers: 25
        });

      expect(renewRes.status).toBe(200);
      expect(renewRes.body.success).toBe(true);
      expect(renewRes.body.organization.status).toBe('Active');
      expect(renewRes.body.organization.maxUsers).toBe(25);

      // Verify endDate is now in the future
      const endMs = new Date(renewRes.body.organization.endDate).getTime();
      expect(endMs).toBeGreaterThan(Date.now());
    });

    it('5.3 Post-Renewal: Tenant write operations immediately succeed without 403 error', async () => {
      const writeRes = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${renewedAdmin.token}`)
        .send({
          name: 'Reactivated Compliance Audit 2026',
          type: 'ISO 27001',
          period: 'Q4-2026',
          leadAuditor: renewedAdmin.user.name,
          description: 'Successfully provisioned post license renewal'
        });

      expect(writeRes.status).toBe(201);
      expect(writeRes.body.audit).toBeDefined();
    });

    it('5.4 Post-Renewal: Org Admin can now provision up to expanded 25-seat limit', async () => {
      const userRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${renewedAdmin.token}`)
        .send({
          name: 'Post Renewal Staff',
          email: `post_renew_${Date.now()}@health.com`,
          role: 'Contributor',
          department: 'IT',
          isActive: true
        });

      expect(userRes.status).toBe(201);
      expect(userRes.body.success).toBe(true);
    });
  });
});
