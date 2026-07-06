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
            { id: crypto.randomUUID(), department: 'IT', task: 'Server Patch Management Log', framework: 'ISO 27001', control_clause: 'A.12.5.1' },
            { id: crypto.randomUUID(), department: 'IT', task: 'Access Review Audit Trail', framework: 'ISO 27001', control_clause: 'A.9.2.5' },
            { id: crypto.randomUUID(), department: 'HR', task: 'Monthly Payroll Register Approval', framework: 'SOC 2', control_clause: 'CC1.2' },
            { id: crypto.randomUUID(), department: 'HR', task: 'New Hire Documentation Completion', framework: 'SOC 2', control_clause: 'CC1.3' },
            { id: crypto.randomUUID(), department: 'Operations', task: 'Daily Output Verification', framework: 'ISO 9001', control_clause: '8.6' },
            { id: crypto.randomUUID(), department: 'Finance', task: 'Quarterly Tax Filing', framework: 'SOC 1', control_clause: 'Control A' },
            { id: crypto.randomUUID(), department: 'Security', task: 'Facility Access Logs Review', framework: 'ISO 27001', control_clause: 'A.11.1.2' },
            { id: crypto.randomUUID(), department: 'Quality Assurance', task: 'ISO 9001 Compliance Check', framework: 'ISO 9001', control_clause: '9.2' },
            { id: crypto.randomUUID(), department: 'Sales', task: 'Sales Contract Review', framework: 'DPDP Act', control_clause: 'Section 4' },
            { id: crypto.randomUUID(), department: 'Marketing', task: 'Marketing Campaign Compliance', framework: 'DPDP Act', control_clause: 'Section 5' },
            { id: crypto.randomUUID(), department: 'Legal', task: 'Vendor Agreement Renewals', framework: 'DPDP Act', control_clause: 'Section 8' }
        ];
        
        for (const c of checklists) {
            await sql`INSERT INTO checklists (id, department, task, framework, control_clause) VALUES (${c.id}, ${c.department}, ${c.task}, ${c.framework}, ${c.control_clause})`;
        }

        console.log('Inserting Activity Logs, Evidence, and DMAX...');
        let lastHash = '0000000000000000000000000000000000000000000000000000000000000000'; // Genesis hash
        
        const generateHash = (prevHash, payload) => {
            return crypto.createHash('sha256').update(prevHash + JSON.stringify(payload)).digest('hex');
        };

        for (const user of users) {
            const now = new Date().toISOString();
            const past1 = new Date(Date.now() - 86400000 * 2).toISOString();
            const past2 = new Date(Date.now() - 86400000 * 5).toISOString();

            // Insert 3 activities per user with sequential hashes
            const act1 = { id: crypto.randomUUID(), action: 'Upload', desc: 'Uploaded audit documentation', time: past2 };
            const hash1 = generateHash(lastHash, act1);
            await sql`INSERT INTO activity (id, userid, username, department, action, description, timestamp, hash, previous_hash) VALUES 
                (${act1.id}, ${user.id}, ${user.name}, ${user.department}, ${act1.action}, ${act1.desc}, ${act1.time}, ${hash1}, ${lastHash})`;
            lastHash = hash1;

            const act2 = { id: crypto.randomUUID(), action: 'Review', desc: 'Reviewed department compliance guidelines', time: past1 };
            const hash2 = generateHash(lastHash, act2);
            await sql`INSERT INTO activity (id, userid, username, department, action, description, timestamp, hash, previous_hash) VALUES 
                (${act2.id}, ${user.id}, ${user.name}, ${user.department}, ${act2.action}, ${act2.desc}, ${act2.time}, ${hash2}, ${lastHash})`;
            lastHash = hash2;
            
            const act3 = { id: crypto.randomUUID(), action: 'Login', desc: 'Logged into the portal', time: now };
            const hash3 = generateHash(lastHash, act3);
            await sql`INSERT INTO activity (id, userid, username, department, action, description, timestamp, hash, previous_hash) VALUES 
                (${act3.id}, ${user.id}, ${user.name}, ${user.department}, ${act3.action}, ${act3.desc}, ${act3.time}, ${hash3}, ${lastHash})`;
            lastHash = hash3;

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
