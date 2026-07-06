const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_Jn8WgiI2kKvG@ep-cold-bonus-aohuzio6-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
const bcrypt = require('bcrypt');

async function run() {
  const users = [
    { id: 'it_dept', name: 'IT Test User', email: 'it@desicrew.in', role: 'Contributor', dept: 'IT', pass: 'password123' },
    { id: 'hr_dept', name: 'HR Test User', email: 'hr@desicrew.in', role: 'Contributor', dept: 'HR', pass: 'password123' },
    { id: 'finance_dept', name: 'Finance Test User', email: 'finance@desicrew.in', role: 'Contributor', dept: 'Finance', pass: 'password123' },
    { id: 'security_dept', name: 'Security Test User', email: 'security@desicrew.in', role: 'Contributor', dept: 'Security', pass: 'password123' }
  ];

  for (const u of users) {
    try {
      const hashedPassword = await bcrypt.hash(u.pass, 10);
      await sql`
        INSERT INTO users (id, name, email, role, department, isactive, password, islocked, loginattempts)
        VALUES (${u.id}, ${u.name}, ${u.email}, ${u.role}, ${u.dept}, 1, ${hashedPassword}, 0, 0)
        ON CONFLICT (email) DO UPDATE SET department = ${u.dept}, password = ${hashedPassword};
      `;
      console.log('Inserted', u.email);
    } catch (e) {
      console.error(e);
    }
  }
  console.log('Done');
}

run();
