const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const sql = neon('postgresql://neondb_owner:npg_Jn8WgiI2kKvG@ep-cold-bonus-aohuzio6-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function run() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await sql`
      UPDATE users SET password = ${hashedPassword}, islocked = 0, loginattempts = 0 WHERE email = 'admin@nitechspark.in';
    `;
    console.log("Admin user unlocked and password set to password123!");
  } catch(e) {
    console.error(e);
  }
}
run();
