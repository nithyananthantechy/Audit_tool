require('dotenv').config({ path: '../.env' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable required.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const departments = ['IT', 'HR', 'Finance', 'Security', 'Operations', 'Quality Assurance'];
  for (const dept of departments) {
    try {
      const email = `${dept.toLowerCase().replace(/[^a-z]/g, '')}@nitechspark.in`;
      const pass = crypto.randomBytes(8).toString('hex') + '#2026';
      const hashedPassword = await bcrypt.hash(pass, 10);
      const id = crypto.randomUUID();

      await sql`
        INSERT INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts, createdAt)
        VALUES (${id}, ${dept + ' Staff'}, ${email}, 'Contributor', ${dept}, 1, ${hashedPassword}, 0, 0, ${new Date().toISOString()})
        ON CONFLICT (email) DO NOTHING;
      `;
      console.log(`Ensured user account exists: ${email}`);
    } catch (e) {
      console.error(`Error configuring ${dept}:`, e.message);
    }
  }
}

run();
