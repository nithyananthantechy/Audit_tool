/**
 * Multi-Tenant Management & Enterprise Licensing QA Acceptance Engine
 * Comprehensive automated test suite validating multi-tenant isolation, 
 * enterprise seat quotas, and licensing lifecycle state machines.
 */

process.env.NODE_ENV = 'test';
process.env.PORT = 3004;

const request = require('supertest');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const app = require('../server');

let passedTests = 0;
let failedTests = 0;
const testResults = [];

function assert(condition, message, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
    testResults.push({ name: message, status: 'PASS', details });
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
    if (details) console.error(`     Details: ${details}`);
    testResults.push({ name: message, status: 'FAIL', details });
  }
}

async function runMultiTenantLicensingQASuite() {
  console.log('\n================================================================');
  console.log('    MULTI-TENANT MANAGEMENT & ENTERPRISE LICENSING QA SUITE     ');
  console.log('================================================================\n');

  try {
    // ------------------------------------------------------------------------
    // SETUP: Authenticate Platform Super Admin (NitechSpark Platform Founder)
    // ------------------------------------------------------------------------
    console.log('[SETUP] Authenticating Platform Super Admin...');
    const saLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@nitechspark.in', password: 'NitechSpark#2026' });

    assert(saLogin.status === 200 && !!saLogin.body.token, 'Super Admin authenticated successfully', `Status: ${saLogin.status}`);
    const superAdminToken = saLogin.body.token;

    // ========================================================================
    // DOMAIN 1: TENANT LIFECYCLE MANAGEMENT & PROVISIONING (CRUD)
    // ========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log(' DOMAIN 1: TENANT LIFECYCLE MANAGEMENT & PROVISIONING (CRUD)   ');
    console.log('----------------------------------------------------------------');

    // 1.1 List Organizations
    console.log('\n[1.1] Listing Organizations as Super Admin...');
    const orgsRes = await request(app)
      .get('/api/admin/organizations')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert(orgsRes.status === 200, 'Super Admin lists organizations (HTTP 200)');
    assert(Array.isArray(orgsRes.body.organizations) && orgsRes.body.organizations.length > 0, 'Organizations array returned with active entities');
    
    const rootOrg = orgsRes.body.organizations.find(o => o.code === 'nitechspark' || o.code === 'niutechspark' || o.id === 'org-niutechspark');
    assert(!!rootOrg, 'Platform Owner organization (NitechSpark) present in registry');
    assert(typeof rootOrg?.activeUsersCount === 'number' && typeof rootOrg?.daysRemaining === 'number', 'Computed metrics (activeUsersCount, daysRemaining) attached to organizations');

    // 1.2 RBAC: Non-Super Admin Access Restriction
    console.log('\n[1.2] Verifying RBAC Restrictions on Organization Registry...');
    // Create a regular Contributor user in root org
    const contribEmail = `contrib_tester_${Date.now()}@nitechspark.in`;
    const contribPass = 'Password#2026';
    const contribUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Audit Contributor',
        email: contribEmail,
        role: 'Contributor',
        department: 'Audit',
        password: contribPass,
        organizationId: 'org-niutechspark'
      });
    
    assert(contribUserRes.status === 201, 'Test contributor user provisioned');
    
    const contribLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: contribEmail, password: contribPass });
    const contribToken = contribLogin.body.token;

    const unauthOrgRes = await request(app)
      .get('/api/admin/organizations')
      .set('Authorization', `Bearer ${contribToken}`);

    assert(unauthOrgRes.status === 403, 'Non-Super Admin blocked from viewing organizations (HTTP 403 Forbidden)');

    // 1.3 Provision New Client Organization & License with Initial Org Admin
    console.log('\n[1.3] Provisioning New Client Tenant & Enterprise License...');
    const tenantPayload = {
      name: 'BioMatrix Health Corp',
      code: `biomatrix-${Date.now()}`,
      contactName: 'Elena Rostova',
      contactEmail: `elena_${Date.now()}@biomatrix.health`,
      plan: 'Enterprise',
      maxUsers: 6,
      durationMonths: 12,
      adminName: 'Elena Rostova',
      adminEmail: `admin_${Date.now()}@biomatrix.health`,
      adminPassword: 'BioMatrix#2026A'
    };

    const createOrgRes = await request(app)
      .post('/api/admin/organizations')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(tenantPayload);

    assert(createOrgRes.status === 201, 'Organization provisioned successfully (HTTP 201 Created)');
    assert(createOrgRes.body.organization.name === tenantPayload.name, 'Organization name matches provisioned payload');
    assert(createOrgRes.body.organization.maxUsers === 6, 'Seat capacity set to 6');
    assert(createOrgRes.body.organization.status === 'Active', 'Initial license status is Active');
    assert(!!createOrgRes.body.orgAdmin && createOrgRes.body.orgAdmin.role === 'Org Admin', 'Initial Org Admin account auto-provisioned');

    const bioMatrixOrgId = createOrgRes.body.organization.id;
    const bioMatrixAdminEmail = tenantPayload.adminEmail;

    // Verify newly provisioned Org Admin can authenticate
    const bioMatrixLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: bioMatrixAdminEmail, password: 'BioMatrix#2026A' });

    assert(bioMatrixLogin.status === 200 && !!bioMatrixLogin.body.token, 'Auto-provisioned Org Admin authenticated successfully');
    const bioMatrixAdminToken = bioMatrixLogin.body.token;

    // 1.4 Slug Collision Handling
    console.log('\n[1.4] Testing Slug / Org Code Collision Handling...');
    const collisionRes = await request(app)
      .post('/api/admin/organizations')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'BioMatrix Duplicate',
        code: tenantPayload.code,
        contactEmail: `dup_${Date.now()}@biomatrix.health`
      });

    assert(collisionRes.status === 201, 'Collision handled without database failure');
    assert(collisionRes.body.organization.code === `${tenantPayload.code}-1`, `Unique slug generated on collision (${collisionRes.body.organization.code})`);

    // 1.5 Update Organization Details
    console.log('\n[1.5] Updating Tenant Configuration (Max Seats, Plan)...');
    const updateRes = await request(app)
      .put(`/api/admin/organizations/${bioMatrixOrgId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'BioMatrix Global Health',
        maxUsers: 12,
        plan: 'Enterprise Elite'
      });

    assert(updateRes.status === 200, 'Organization details updated (HTTP 200)');
    assert(updateRes.body.organization.name === 'BioMatrix Global Health', 'Updated company name persisted');
    assert(updateRes.body.organization.maxUsers === 12, 'Updated seat count persisted (12 seats)');

    // 1.6 Platform Owner Deletion Guard
    console.log('\n[1.6] Verifying Platform Owner Protection Against Deletion...');
    const delOwnerRes = await request(app)
      .delete('/api/admin/organizations/org-niutechspark')
      .set('Authorization', `Bearer ${superAdminToken}`);

    assert(delOwnerRes.status === 400, 'Platform Owner deletion strictly blocked (HTTP 400 Bad Request)');
    assert(delOwnerRes.body.error.includes('platform owner'), 'Accurate protection notice returned');

    // ========================================================================
    // DOMAIN 2: MULTI-TENANT CROSS-TENANT DATA ISOLATION
    // ========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log(' DOMAIN 2: MULTI-TENANT DATA ISOLATION & ACCESS CONTROL         ');
    console.log('----------------------------------------------------------------');

    // Provision a second client organization (Nexus Cloud)
    console.log('\n[2.1] Setting up Second Independent Tenant (Nexus Cloud)...');
    const nexusPayload = {
      name: 'Nexus Cloud Services',
      code: `nexus-${Date.now()}`,
      contactName: 'Marcus Vance',
      contactEmail: `marcus_${Date.now()}@nexuscloud.com`,
      maxUsers: 5,
      adminName: 'Marcus Vance',
      adminEmail: `admin_${Date.now()}@nexuscloud.com`,
      adminPassword: 'NexusSecure#2026'
    };

    const createNexusRes = await request(app)
      .post('/api/admin/organizations')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(nexusPayload);

    assert(createNexusRes.status === 201, 'Second tenant (Nexus Cloud) provisioned');
    const nexusOrgId = createNexusRes.body.organization.id;

    const nexusLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: nexusPayload.adminEmail, password: 'NexusSecure#2026' });
    const nexusAdminToken = nexusLogin.body.token;

    // 2.2 User Directory Isolation
    console.log('\n[2.2] Testing User Directory Tenant Isolation...');
    // Add user to BioMatrix
    const bioUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${bioMatrixAdminToken}`)
      .send({
        name: 'Bio Staff One',
        email: `staff_${Date.now()}@biomatrix.health`,
        role: 'Contributor',
        department: 'Operations',
        isActive: true
      });
    assert(bioUserRes.status === 201, 'User added to BioMatrix tenant');
    const bioUserId = bioUserRes.body.user.id;

    // Nexus Admin queries users: must NOT see BioMatrix staff
    const nexusUsersRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${nexusAdminToken}`);

    assert(nexusUsersRes.status === 200, 'Nexus Admin queried users');
    const nexusUsers = Array.isArray(nexusUsersRes.body) ? nexusUsersRes.body : (nexusUsersRes.body.users || []);
    const leakedBioUser = nexusUsers.find(u => u.id === bioUserId);
    assert(!leakedBioUser, 'Data Segregation PASS: Nexus cannot see BioMatrix user directory');

    // 2.3 Cross-Tenant User Mutation Rejection
    console.log('\n[2.3] Testing Cross-Tenant User Tampering Rejection (403)...');
    const crossUpdateRes = await request(app)
      .put(`/api/users/${bioUserId}`)
      .set('Authorization', `Bearer ${nexusAdminToken}`)
      .send({ name: 'Tampered Staff Name' });

    assert(crossUpdateRes.status === 403, 'Cross-tenant user modification strictly blocked (HTTP 403 Forbidden)');

    // 2.4 Governance Audits Tenant Isolation
    console.log('\n[2.4] Testing Governance Audit Isolation across Tenants...');
    const bioAuditRes = await request(app)
      .post('/api/audits')
      .set('Authorization', `Bearer ${bioMatrixAdminToken}`)
      .send({
        name: 'BioMatrix HIPAA Security Audit 2026',
        type: 'ISO 27001 Audit',
        period: 'Q3-2026',
        leadAuditor: 'Elena Rostova',
        description: 'Classified healthcare compliance audit'
      });

    assert(bioAuditRes.status === 201, 'BioMatrix created HIPAA compliance audit');
    const bioAuditId = bioAuditRes.body.audit.id || bioAuditRes.body.audit.auditId;

    // Nexus queries audits: must NOT see BioMatrix's audit
    const nexusAuditsRes = await request(app)
      .get('/api/audits')
      .set('Authorization', `Bearer ${nexusAdminToken}`);

    const nexusAudits = Array.isArray(nexusAuditsRes.body) ? nexusAuditsRes.body : (nexusAuditsRes.body.audits || []);
    const leakedAudit = nexusAudits.find(a => a.id === bioAuditId || a.name === 'BioMatrix HIPAA Security Audit 2026');
    assert(!leakedAudit, 'Data Segregation PASS: Nexus cannot see BioMatrix audits');

    // 2.5 Evidence Requests Tenant Isolation
    console.log('\n[2.5] Testing Evidence Requests Tenant Isolation...');
    const bioReqRes = await request(app)
      .post('/api/evidence-requests')
      .set('Authorization', `Bearer ${bioMatrixAdminToken}`)
      .send({
        auditId: bioAuditId,
        controlId: 'A.12.1.2',
        department: 'Operations',
        evidenceRequired: 'BioMatrix patient database encryption keys',
        priority: 'High',
        dueDate: '2026-09-30'
      });

    assert(bioReqRes.status === 201, 'BioMatrix created confidential evidence request');
    const bioReqId = bioReqRes.body.requestId;

    const nexusReqsRes = await request(app)
      .get('/api/evidence-requests')
      .set('Authorization', `Bearer ${nexusAdminToken}`);

    const nexusReqs = Array.isArray(nexusReqsRes.body) ? nexusReqsRes.body : (nexusReqsRes.body.evidenceRequests || []);
    const leakedReq = nexusReqs.find(r => r.requestId === bioReqId);
    assert(!leakedReq, 'Data Segregation PASS: Nexus cannot see BioMatrix evidence requests');

    // ========================================================================
    // DOMAIN 3: ENTERPRISE SEAT QUOTA & LIMIT ENFORCEMENT
    // ========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log(' DOMAIN 3: ENTERPRISE SEAT QUOTA & LIMIT ENFORCEMENT            ');
    console.log('----------------------------------------------------------------');

    console.log('\n[3.1] Provisioning Small Tenant with Exact Limit of 2 Seats...');
    const smallOrgPayload = {
      name: 'Micro Scale Solutions',
      code: `micro-${Date.now()}`,
      contactEmail: `micro_${Date.now()}@microscale.io`,
      maxUsers: 2,
      adminName: 'Micro Admin',
      adminEmail: `admin_${Date.now()}@microscale.io`,
      adminPassword: 'MicroPass#2026!'
    };

    const smallOrgRes = await request(app)
      .post('/api/admin/organizations')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(smallOrgPayload);

    assert(smallOrgRes.status === 201, 'Micro Scale Solutions provisioned with 2 seats');
    const microOrgId = smallOrgRes.body.organization.id;

    const microLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: smallOrgPayload.adminEmail, password: 'MicroPass#2026!' });
    const microAdminToken = microLogin.body.token;

    // Active users in MicroScale = 1 (Micro Admin)
    // 3.2 Provision 2nd User (2/2 seats used)
    console.log('\n[3.2] Provisioning 2nd User (Seat 2 of 2)...');
    const secondUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${microAdminToken}`)
      .send({
        name: 'Staff Member Two',
        email: `staff2_${Date.now()}@microscale.io`,
        role: 'Contributor',
        department: 'Operations',
        isActive: true
      });

    assert(secondUserRes.status === 201, 'Second user provisioned (2/2 seats filled)');
    const secondUserId = secondUserRes.body.user.id;

    // 3.3 Attempt to provision 3rd User exceeding quota
    console.log('\n[3.3] Attempting to Provision 3rd User (Exceeding 2-Seat Quota)...');
    const overQuotaRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${microAdminToken}`)
      .send({
        name: 'Staff Member Three (Over Quota)',
        email: `staff3_${Date.now()}@microscale.io`,
        role: 'Contributor',
        department: 'Operations',
        isActive: true
      });

    assert(overQuotaRes.status === 400, 'Over-quota provisioning blocked (HTTP 400 Bad Request)');
    assert(overQuotaRes.body.error.includes('Seat limit reached'), 'Descriptive seat limit warning returned');
    assert(overQuotaRes.body.error.includes('2/2 seats used'), 'Accurate utilization figures (2/2) included in error');

    // 3.4 Deactivate a user to free up seat quota
    console.log('\n[3.4] Deactivating User to Free Up Seat Capacity...');
    const deactivateRes = await request(app)
      .put(`/api/users/${secondUserId}`)
      .set('Authorization', `Bearer ${microAdminToken}`)
      .send({ isActive: false });

    assert(deactivateRes.status === 200, 'User successfully deactivated');

    // 3.5 Re-attempt provisioning: should now succeed
    console.log('\n[3.5] Provisioning User with Reclaimed Seat...');
    const retryProvisionRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${microAdminToken}`)
      .send({
        name: 'Staff Member Three (Now Allowed)',
        email: `staff3_${Date.now()}@microscale.io`,
        role: 'Contributor',
        department: 'Operations',
        isActive: true
      });

    assert(retryProvisionRes.status === 201, 'User provisioned successfully using reclaimed seat quota');

    // ========================================================================
    // DOMAIN 4: ENTERPRISE LICENSE EXPIRATION & SUSPENSION GATEKEEPING
    // ========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log(' DOMAIN 4: LICENSE EXPIRATION & SUSPENSION ENFORCEMENT           ');
    console.log('----------------------------------------------------------------');

    const nowMs = Date.now();

    // 4.1 Expiring Soon State (daysRemaining <= 10)
    console.log('\n[4.1] Testing Expiring Soon State (<= 10 Days)...');
    const expSoonOrgId = 'org-expsoon-' + crypto.randomBytes(4).toString('hex');
    await app.db.prepare(
      'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      expSoonOrgId, 'Expiring Warning Corp', 'expwarning', 'Warning Contact', 'warn@test.com', 'Active', 'Enterprise', 10,
      new Date(nowMs - 355 * 86400000).toISOString(), new Date(nowMs + 6 * 86400000).toISOString(), '["audits"]', new Date().toISOString()
    );

    // Create user in expiring soon org
    const expSoonPass = 'ExpPass#2026';
    const expSoonEmail = `warn_admin_${nowMs}@test.com`;
    const hashedPass = bcrypt.hashSync(expSoonPass, 10);
    const expSoonUserId = 'u_expsoon_' + crypto.randomBytes(4).toString('hex');
    await app.db.prepare(
      'INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(expSoonUserId, 'Warn Admin', expSoonEmail, 'Org Admin', 'Admin', 1, hashedPass, 0, 0, expSoonOrgId, new Date().toISOString());

    const expSoonLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: expSoonEmail, password: expSoonPass });
    const expSoonToken = expSoonLogin.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expSoonToken}`);

    assert(meRes.status === 200, 'Expiring soon user authenticated');
    assert(meRes.body.user.organization?.isExpiringSoon === true, 'Auth middleware correctly flags isExpiringSoon: true');
    assert(meRes.body.user.organization?.daysRemaining <= 10 && meRes.body.user.organization?.daysRemaining >= 0, `daysRemaining accurately computed (${meRes.body.user.organization?.daysRemaining} days)`);

    // 4.2 Expired License Enforcement (Write Blocking vs Read Permitted)
    console.log('\n[4.2] Testing Expired License Enforcement...');
    const expiredOrgId = 'org-expired-' + crypto.randomBytes(4).toString('hex');
    await app.db.prepare(
      'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      expiredOrgId, 'Lapsed Compliance Corp', 'lapsed-org', 'Lapsed Contact', 'lapsed@test.com', 'Expired', 'Enterprise', 10,
      new Date(nowMs - 370 * 86400000).toISOString(), new Date(nowMs - 5 * 86400000).toISOString(), '["audits"]', new Date().toISOString()
    );

    const lapsedEmail = `lapsed_admin_${nowMs}@test.com`;
    const lapsedUserId = 'u_lapsed_' + crypto.randomBytes(4).toString('hex');
    await app.db.prepare(
      'INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(lapsedUserId, 'Lapsed Admin', lapsedEmail, 'Org Admin', 'Admin', 1, hashedPass, 0, 0, expiredOrgId, new Date().toISOString());

    const lapsedLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: lapsedEmail, password: expSoonPass });
    const lapsedToken = lapsedLogin.body.token;

    // Mutating write operation: MUST be blocked with 403
    const blockedWriteRes = await request(app)
      .post('/api/audits')
      .set('Authorization', `Bearer ${lapsedToken}`)
      .send({ name: 'Audit On Expired Tenant', type: 'ISO 27001' });

    assert(blockedWriteRes.status === 403, 'Write operation on expired license strictly blocked (HTTP 403 Forbidden)');
    assert(blockedWriteRes.body.licenseExpired === true, 'licenseExpired: true flag in error response');
    assert(blockedWriteRes.body.error.includes('expired'), 'Explicit expired subscription notice provided');

    // Read operation: MUST remain permitted (compliance data retrievability requirement)
    const allowedReadRes = await request(app)
      .get('/api/audits')
      .set('Authorization', `Bearer ${lapsedToken}`);

    assert(allowedReadRes.status === 200, 'Read operation on expired license permitted (Read-Only Grace Guarantee)');

    // 4.3 Suspended License Enforcement
    console.log('\n[4.3] Testing Suspended License Enforcement...');
    const suspendedOrgId = 'org-susp-' + crypto.randomBytes(4).toString('hex');
    await app.db.prepare(
      'INSERT INTO organizations (id, name, code, contactName, contactEmail, status, plan, maxUsers, startDate, endDate, features, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      suspendedOrgId, 'Breached Security Corp', 'breached-org', 'Breach Contact', 'breach@test.com', 'Suspended', 'Enterprise', 10,
      new Date(nowMs).toISOString(), new Date(nowMs + 90 * 86400000).toISOString(), '["audits"]', new Date().toISOString()
    );

    const suspEmail = `susp_admin_${nowMs}@test.com`;
    const suspUserId = 'u_susp_' + crypto.randomBytes(4).toString('hex');
    await app.db.prepare(
      'INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(suspUserId, 'Suspended Admin', suspEmail, 'Org Admin', 'Admin', 1, hashedPass, 0, 0, suspendedOrgId, new Date().toISOString());

    const suspLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: suspEmail, password: expSoonPass });
    const suspToken = suspLogin.body.token;

    const blockedSuspWriteRes = await request(app)
      .post('/api/audits')
      .set('Authorization', `Bearer ${suspToken}`)
      .send({ name: 'Audit On Suspended Tenant', type: 'ISO 27001' });

    assert(blockedSuspWriteRes.status === 403, 'Write operation on suspended tenant strictly blocked (HTTP 403 Forbidden)');
    assert(blockedSuspWriteRes.body.error.includes('suspended'), 'Clear suspension notice returned');

    // ========================================================================
    // DOMAIN 5: LICENSE RENEWAL & CAPACITY EXPANSION WORKFLOW
    // ========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log(' DOMAIN 5: LICENSE RENEWAL & CAPACITY EXPANSION WORKFLOW        ');
    console.log('----------------------------------------------------------------');

    console.log('\n[5.1] Executing License Renewal on the Expired Tenant...');
    const renewRes = await request(app)
      .post(`/api/admin/organizations/${expiredOrgId}/renew`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        extensionMonths: 12,
        newMaxUsers: 50
      });

    assert(renewRes.status === 200, 'License renewal executed successfully (HTTP 200)');
    assert(renewRes.body.organization.status === 'Active', 'Status reset to Active');
    assert(renewRes.body.organization.maxUsers === 50, 'Seat capacity expanded to 50');
    assert(new Date(renewRes.body.organization.endDate).getTime() > Date.now(), 'Expiration date extended into the future');

    console.log('\n[5.2] Verifying Previously Blocked Tenant Immediately Regains Write Capability...');
    const reactivatedWriteRes = await request(app)
      .post('/api/audits')
      .set('Authorization', `Bearer ${lapsedToken}`)
      .send({
        name: 'Reactivated Post-Renewal Compliance Audit',
        type: 'ISO 27001 Audit',
        period: 'Q4-2026',
        leadAuditor: 'Lapsed Admin',
        description: 'Audit created immediately following subscription renewal'
      });

    assert(reactivatedWriteRes.status === 201, 'Write request succeeded post-renewal (HTTP 201 Created)');
    assert(!!reactivatedWriteRes.body.audit, 'Audit persisted successfully in database');

    console.log('\n[5.3] Cleaning up Test Client Organizations...');
    const cleanupIds = [bioMatrixOrgId, nexusOrgId, microOrgId, expSoonOrgId, expiredOrgId, suspendedOrgId];
    for (const orgId of cleanupIds) {
      await request(app)
        .delete(`/api/admin/organizations/${orgId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
    }
    console.log(`  ✔ Cleaned up ${cleanupIds.length} ephemeral test organizations.`);

    // ========================================================================
    // FINAL AUDIT & TEST SCORECARD
    // ========================================================================
    console.log('\n================================================================');
    console.log('        MULTI-TENANT & ENTERPRISE LICENSING TEST SUMMARY        ');
    console.log('================================================================');
    console.log(`  Total Test Cases Executed : ${passedTests + failedTests}`);
    console.log(`  Total Passed              : ${passedTests}`);
    console.log(`  Total Failed              : ${failedTests}`);
    console.log(`  Acceptance Rate           : ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
    console.log('================================================================\n');

    if (failedTests > 0) {
      console.error('❌ SOME TESTS FAILED. Please inspect the logs above.');
      process.exit(1);
    } else {
      console.log('🎉 ALL MULTI-TENANT & ENTERPRISE LICENSING TESTS PASSED PERFECTLY!\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('\n❌ Unhandled Fatal Exception in QA Test Suite:', err);
    process.exit(1);
  }
}

runMultiTenantLicensingQASuite();
