require('dotenv').config({ path: '../.env.production' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');

// Using the provided Neon URL as fallback if env is missing
const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Jn8WgiI2kKvG@ep-cold-bonus-aohuzio6-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function seed() {
    try {
        console.log('Starting database seeding...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const coreUsers = [
            { id: 'admin1', name: 'Super Admin', email: 'admin@nitechspark.in', role: 'Super Admin', dept: 'IT' },
            { id: 'it_user', name: 'IT Staff', email: 'it@desicrew.in', role: 'Manager Approver', dept: 'IT' },
            { id: 'hr_user', name: 'HR Staff', email: 'hr@desicrew.in', role: 'Manager Approver', dept: 'HR' },
            { id: 'finance_user', name: 'Finance Staff', email: 'finance@desicrew.in', role: 'Manager Approver', dept: 'Finance' },
            { id: 'security_user', name: 'Security Staff', email: 'security@desicrew.in', role: 'Manager Approver', dept: 'Security' },
            { id: 'sales_user', name: 'Sales Staff', email: 'sales@desicrew.in', role: 'Contributor', dept: 'Sales' },
            { id: 'ops_user', name: 'Operations Staff', email: 'operations@desicrew.in', role: 'Contributor', dept: 'Operations' }
        ];

        for (const user of coreUsers) {
            await sql`
                INSERT INTO users (id, name, email, role, department, isactive, password, islocked, loginattempts)
                VALUES (${user.id}, ${user.name}, ${user.email}, ${user.role}, ${user.dept}, 1, ${hashedPassword}, 0, 0)
                ON CONFLICT (email) DO UPDATE SET 
                    password = ${hashedPassword}, 
                    role = ${user.role}, 
                    department = ${user.dept};
            `;
            console.log(`Upserted user: ${user.email}`);
        }
        
        console.log('Database seeded successfully with all core department users!');
    } catch (e) {
        console.error('Seeding error:', e);
    }
}

seed();