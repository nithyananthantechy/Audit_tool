const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const sql = neon('postgresql://neondb_owner:npg_Jn8WgiI2kKvG@ep-cold-bonus-aohuzio6-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function run() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await sql`
      INSERT INTO users (id, name, email, role, department, isactive, password, islocked, loginattempts)
      VALUES ('admin1', 'Admin User', 'admin@nitechspark.in', 'Super Admin', 'IT', 1, ${hashedPassword}, 0, 0)
      ON CONFLICT (email) DO UPDATE SET password = ${hashedPassword}, role = 'Super Admin';
    `;
    console.log("Admin user created/updated!");
  } catch(e) {
    console.error(e);
  }
}
run();
