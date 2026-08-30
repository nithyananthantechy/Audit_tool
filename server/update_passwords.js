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
  try {
    const users = await sql`SELECT id, name, email FROM users`;
    for (const user of users) {
      const generatedPass = crypto.randomBytes(8).toString('hex') + '#2026';
      const newPasswordHash = bcrypt.hashSync(generatedPass, 10);
      await sql`UPDATE users SET password = ${newPasswordHash}, mustChangePassword = 1 WHERE id = ${user.id}`;
      console.log(`Updated security credentials for ${user.name} (${user.email})`);
    }
  } catch (e) {
    console.error('Error updating users:', e.message);
  }
}

run();
