require('dotenv').config({ path: '../.env.production' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');

const sql = neon(process.env.DATABASE_URL);

async function run() {
    try {
        console.log('Fetching all users...');
        const users = await sql`SELECT * FROM users`;
        
        console.log(`Found ${users.length} users. Updating...`);
        const newPassword = bcrypt.hashSync('SecureDemo#2026!', 10);
        
        for (const user of users) {
            let email = user.email;
            if (email.endsWith('@desicrew.in')) {
                email = email.replace('@desicrew.in', '@nitechspark.in');
            }
            
            await sql`UPDATE users SET email = ${email}, password = ${newPassword} WHERE id = ${user.id}`;
            console.log(`Updated user ${user.name} (${email})`);
        }
        
        console.log('Successfully updated all passwords and emails!');
        process.exit(0);
    } catch (e) {
        console.error('Error updating users:', e);
        process.exit(1);
    }
}

run();
