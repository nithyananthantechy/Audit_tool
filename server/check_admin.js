require('dotenv').config({ path: '../.env' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable required.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const targetEmail = process.argv[2] || 'admin@nitechspark.in';
  const newPassword = process.argv[3];

  if (!newPassword || newPassword.length < 8) {
    console.error('Usage: node check_admin.js <email> <newPassword(min 8 chars)>');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    await sql`
      UPDATE users SET password = ${hashedPassword}, isLocked = 0, loginAttempts = 0 WHERE email = ${targetEmail.trim()};
    `;
    console.log(`User ${targetEmail} unlocked and password reset.`);
  } catch(e) {
    console.error('Admin reset error:', e.message);
  }
}
run();
