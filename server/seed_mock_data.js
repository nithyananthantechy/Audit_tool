require('dotenv').config({ path: '../.env.production' });
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Jn8WgiI2kKvG@ep-cold-bonus-aohuzio6-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function seedMockData() {
    try {
        console.log('Fetching users to map data...');
        const users = await sql`SELECT * FROM users`;
        if (users.length === 0) {
            console.log('No users found. Run seed.js first.');
            return;
        }

        console.log('Clearing old mock data...');
        await sql`DELETE FROM activity`;
        await sql`DELETE FROM evidence`;
        await sql`DELETE FROM dmax`;
        await sql`DELETE FROM checklists`;

        console.log('Inserting Checklists...');
        const checklists = [
            { id: crypto.randomUUID(), department: 'IT', task: 'Server Patch Management Log' },
            { id: crypto.randomUUID(), department: 'IT', task: 'Access Review Audit Trail' },
            { id: crypto.randomUUID(), department: 'HR', task: 'Monthly Payroll Register Approval' },
            { id: crypto.randomUUID(), department: 'HR', task: 'New Hire Documentation Completion' },
            { id: crypto.randomUUID(), department: 'Operations', task: 'Daily Output Verification' },
            { id: crypto.randomUUID(), department: 'Finance', task: 'Quarterly Tax Filing' },
            { id: crypto.randomUUID(), department: 'Security', task: 'Facility Access Logs Review' },
            { id: crypto.randomUUID(), department: 'Quality Assurance', task: 'ISO 9001 Compliance Check' },
            { id: crypto.randomUUID(), department: 'Sales', task: 'Sales Contract Review' },
            { id: crypto.randomUUID(), department: 'Marketing', task: 'Marketing Campaign Compliance' },
            { id: crypto.randomUUID(), department: 'Legal', task: 'Vendor Agreement Renewals' }
        ];
        
        for (const c of checklists) {
            await sql`INSERT INTO checklists (id, department, task) VALUES (${c.id}, ${c.department}, ${c.task})`;
        }

        console.log('Inserting Activity Logs, Evidence, and DMAX...');
        for (const user of users) {
            const now = new Date().toISOString();
            const past1 = new Date(Date.now() - 86400000 * 2).toISOString();
            const past2 = new Date(Date.now() - 86400000 * 5).toISOString();

            // Insert 3 activities per user
            await sql`INSERT INTO activity (id, userid, username, department, action, description, timestamp) VALUES 
                (${crypto.randomUUID()}, ${user.id}, ${user.name}, ${user.department}, 'Login', 'Logged into the portal', ${now})`;
            await sql`INSERT INTO activity (id, userid, username, department, action, description, timestamp) VALUES 
                (${crypto.randomUUID()}, ${user.id}, ${user.name}, ${user.department}, 'Review', 'Reviewed department compliance guidelines', ${past1})`;
            await sql`INSERT INTO activity (id, userid, username, department, action, description, timestamp) VALUES 
                (${crypto.randomUUID()}, ${user.id}, ${user.name}, ${user.department}, 'Upload', 'Uploaded audit documentation', ${past2})`;

            // Insert Evidence for the user
            const cl = checklists.find(c => c.department === user.department) || checklists[0];
            await sql`INSERT INTO evidence (id, userid, username, department, checklistid, description, filename, filetype, submittedat, status) VALUES 
                (${crypto.randomUUID()}, ${user.id}, ${user.name}, ${user.department}, ${cl.id}, 'Q2 Compliance Report', 'q2_report.pdf', 'application/pdf', ${past1}, 'Approved')`;
            await sql`INSERT INTO evidence (id, userid, username, department, checklistid, description, filename, filetype, submittedat, status) VALUES 
                (${crypto.randomUUID()}, ${user.id}, ${user.name}, ${user.department}, ${cl.id}, 'Monthly Status Update', 'status_update.docx', 'application/msword', ${now}, 'Pending')`;

            // Insert DMAX (Tickets/Issues)
            await sql`INSERT INTO dmax (id, ticketid, department, description, severity, reportedby, reportedat, status, assignedto, resolvedat) VALUES 
                (${crypto.randomUUID()}, ${'TKT-' + Math.floor(Math.random()*10000)}, ${user.department}, 'Minor non-compliance observed during internal review', 'Medium', ${user.name}, ${past2}, 'Open', 'audit@nitechspark.in', null)`;
        }

        console.log('Mock Data Seeding Complete!');
    } catch (e) {
        console.error('Error seeding mock data:', e);
    }
}

seedMockData();
