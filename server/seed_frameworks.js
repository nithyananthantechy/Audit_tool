require('dotenv').config({ path: '../.env.production' });
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const sql = neon(process.env.DATABASE_URL);

async function seedFrameworks() {
    try {
        console.log('Clearing existing checklists...');
        await sql`DELETE FROM checklists`;

        console.log('Seeding verified DPDP Act and ISO 27001 frameworks...');
        const verifiedChecklists = [
            // DPDP Act Mappings
            { id: crypto.randomUUID(), department: 'IT', task: 'Implement reasonable security safeguards', framework: 'DPDP Act', control_clause: 'Sec 8(5)' },
            { id: crypto.randomUUID(), department: 'Security', task: 'Breach reporting to Board and Principals', framework: 'DPDP Act', control_clause: 'Sec 8(6)' },
            { id: crypto.randomUUID(), department: 'HR', task: 'Publish DPO contact info', framework: 'DPDP Act', control_clause: 'Sec 8(9)' },
            { id: crypto.randomUUID(), department: 'Legal', task: 'Establish grievance redressal mechanism', framework: 'DPDP Act', control_clause: 'Sec 8(10)' },
            { id: crypto.randomUUID(), department: 'Legal', task: 'Data erasure on consent withdrawal', framework: 'DPDP Act', control_clause: 'Sec 8(7)–8(8)' },
            { id: crypto.randomUUID(), department: 'Sales', task: 'Legitimate consent-free use processing', framework: 'DPDP Act', control_clause: 'Sec 7' },
            { id: crypto.randomUUID(), department: 'Marketing', task: 'Legitimate consent-free use processing', framework: 'DPDP Act', control_clause: 'Sec 7' },
            { id: crypto.randomUUID(), department: 'Research & Development', task: 'Verifiable parental consent for minors', framework: 'DPDP Act', control_clause: 'Sec 9' },
            { id: crypto.randomUUID(), department: 'Procurement', task: 'Data Processor contract obligations', framework: 'DPDP Act', control_clause: 'Data Processor obligations' },
            { id: crypto.randomUUID(), department: 'Executive', task: 'Appoint India-based DPO & data auditor', framework: 'DPDP Act', control_clause: 'Sec 10' },
            { id: crypto.randomUUID(), department: 'Governance', task: 'Handle Data Protection Board complaints', framework: 'DPDP Act', control_clause: 'Sec 18' },
            
            // ISO 27001 Mappings
            { id: crypto.randomUUID(), department: 'Security', task: 'Threat intelligence collection', framework: 'ISO 27001', control_clause: 'A.5.7' },
            { id: crypto.randomUUID(), department: 'IT', task: 'Monitoring activities and logs', framework: 'ISO 27001', control_clause: 'A.8.16' },
            { id: crypto.randomUUID(), department: 'IT', task: 'Data leakage prevention', framework: 'ISO 27001', control_clause: 'A.8.12' },
            { id: crypto.randomUUID(), department: 'IT', task: 'Use of cryptography', framework: 'ISO 27001', control_clause: 'A.8.24' },
            { id: crypto.randomUUID(), department: 'Security', task: 'Information security for cloud services', framework: 'ISO 27001', control_clause: 'A.5.23' },
            { id: crypto.randomUUID(), department: 'HR', task: 'Employment screening and training', framework: 'ISO 27001', control_clause: 'A.6.1–A.6.3' },
            { id: crypto.randomUUID(), department: 'HR', task: 'Information security event reporting', framework: 'ISO 27001', control_clause: 'A.6.8' },
            { id: crypto.randomUUID(), department: 'Compliance', task: 'Legal and regulatory requirements', framework: 'ISO 27001', control_clause: 'A.5.31' },
            { id: crypto.randomUUID(), department: 'Compliance', task: 'Privacy and protection of PII', framework: 'ISO 27001', control_clause: 'A.5.34' },
            { id: crypto.randomUUID(), department: 'Operations', task: 'ICT readiness for business continuity', framework: 'ISO 27001', control_clause: 'A.5.30' },
            { id: crypto.randomUUID(), department: 'Facilities', task: 'Physical security monitoring', framework: 'ISO 27001', control_clause: 'A.7.4' },
            { id: crypto.randomUUID(), department: 'Procurement', task: 'Supplier relationship security', framework: 'ISO 27001', control_clause: 'A.5.19–A.5.22' },
            { id: crypto.randomUUID(), department: 'Finance', task: 'Acceptable use of information assets', framework: 'ISO 27001', control_clause: 'A.5.10' },
            { id: crypto.randomUUID(), department: 'Executive', task: 'Policies for information security', framework: 'ISO 27001', control_clause: 'A.5.1' },
            { id: crypto.randomUUID(), department: 'Governance', task: 'Information security roles', framework: 'ISO 27001', control_clause: 'A.5.2' }
        ];
        
        for (const c of verifiedChecklists) {
            await sql`INSERT INTO checklists (id, department, task, framework, control_clause) VALUES (${c.id}, ${c.department}, ${c.task}, ${c.framework}, ${c.control_clause})`;
        }

        console.log('Successfully seeded framework checklists!');
        process.exit(0);
    } catch (e) {
        console.error('Error seeding framework data:', e);
        process.exit(1);
    }
}

seedFrameworks();
