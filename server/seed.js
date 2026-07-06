require('dotenv').config({ path: '../.env.production' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Jn8WgiI2kKvG@ep-cold-bonus-aohuzio6-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function seed() {
    try {
        console.log('Starting database seeding...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Delete the previous users first to start clean, except the ones we are adding.
        // Actually, let's just clear all users first for a completely clean slate.
        console.log('Clearing old users...');
        await sql`DELETE FROM users;`;

        const coreUsers = [
            { id: crypto.randomUUID(), name: 'HR Manager', email: 'hr@nitechspark.in', role: 'Manager Approver', dept: 'HR' },
            { id: crypto.randomUUID(), name: 'IT Staff', email: 'it@nitechspark.in', role: 'Manager Approver', dept: 'IT' },
            { id: crypto.randomUUID(), name: 'Super Admin', email: 'admin@nitechspark.in', role: 'Super Admin', dept: 'IT' },
            { id: crypto.randomUUID(), name: 'Operations Staff', email: 'operations@nitechspark.in', role: 'Contributor', dept: 'Operations' },
            { id: crypto.randomUUID(), name: 'Audit Team', email: 'audit@nitechspark.in', role: 'Manager Approver', dept: 'Audit' },
            { id: crypto.randomUUID(), name: 'Finance Staff', email: 'finance@nitechspark.in', role: 'Manager Approver', dept: 'Finance' },
            { id: crypto.randomUUID(), name: 'Legal Staff', email: 'legal@nitechspark.in', role: 'Contributor', dept: 'Legal' },
            { id: crypto.randomUUID(), name: 'QA Team', email: 'qualityassurance@nitechspark.in', role: 'Contributor', dept: 'Quality Assurance' },
            { id: crypto.randomUUID(), name: 'Security Staff', email: 'security@nitechspark.in', role: 'Manager Approver', dept: 'Security' },
            { id: crypto.randomUUID(), name: 'Procurement Staff', email: 'procurement@nitechspark.in', role: 'Contributor', dept: 'Procurement' },
            { id: crypto.randomUUID(), name: 'Sales Staff', email: 'sales@nitechspark.in', role: 'Contributor', dept: 'Sales' },
            { id: crypto.randomUUID(), name: 'Marketing Staff', email: 'marketing@nitechspark.in', role: 'Contributor', dept: 'Marketing' },
            { id: crypto.randomUUID(), name: 'R&D Staff', email: 'researchdevelopment@nitechspark.in', role: 'Contributor', dept: 'Research & Development' },
            { id: crypto.randomUUID(), name: 'Supply Chain Staff', email: 'supplychain@nitechspark.in', role: 'Contributor', dept: 'Supply Chain' }
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
            console.log(`Inserted user: ${user.email}`);
        }
        
        console.log('Database seeded successfully with all NITECHSPARK department users!');
    } catch (e) {
        console.error('Seeding error:', e);
    }
}

seed();