require('dotenv').config({ path: '../.env' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required to run seed script.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  try {
    console.log('Starting database initialization and seeding...');
    const seedPassword = crypto.randomBytes(8).toString('hex') + '#2026';
    const hashedPassword = await bcrypt.hash(seedPassword, 10);

    const coreUsers = [
      { id: crypto.randomUUID(), name: 'HR Manager', email: 'hr@nitechspark.in', role: 'Manager', dept: 'HR' },
      { id: crypto.randomUUID(), name: 'IT Staff', email: 'it@nitechspark.in', role: 'Manager', dept: 'IT' },
      { id: crypto.randomUUID(), name: 'Super Admin', email: 'admin@nitechspark.in', role: 'Super Admin', dept: 'Admin' },
      { id: crypto.randomUUID(), name: 'Operations Staff', email: 'operations@nitechspark.in', role: 'Contributor', dept: 'Operations' },
      { id: crypto.randomUUID(), name: 'Internal Auditor', email: 'auditor.internal@nitechspark.in', role: 'Internal Auditor', dept: 'Audit' },
      { id: crypto.randomUUID(), name: 'External Auditor', email: 'auditor.external@nitechspark.in', role: 'External Auditor', dept: 'Audit' },
      { id: crypto.randomUUID(), name: 'Security Staff', email: 'security@nitechspark.in', role: 'Manager', dept: 'Security' }
    ];

    for (const user of coreUsers) {
      await sql`
        INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts, createdAt)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${user.role}, ${user.dept}, 1, ${hashedPassword}, 0, 0, ${new Date().toISOString()})
        ON CONFLICT (email) DO NOTHING;
      `;
      console.log(`Initialized user account: ${user.email}`);
    }

    console.log('Database seeding finished.');
  } catch (e) {
    console.error('Seeding error:', e.message);
  }
}

seed();