const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const DB_FILE = path.join(__dirname, 'audit.db');
const db = new Database(DB_FILE);

console.log('Migrating existing users...');

const users = db.prepare('SELECT id, password, isActive FROM users').all();
let activeFixed = 0;
let hashedCount = 0;

users.forEach(user => {
    let needsUpdate = false;
    let newPassword = user.password;
    let newIsActive = user.isActive;

    if (user.isActive === 0) {
        newIsActive = 1;
        needsUpdate = true;
        activeFixed++;
        console.log(`Fixing isActive for user ${user.id}`);
    }

    if (!user.password.startsWith('$2')) {
        newPassword = bcrypt.hashSync(user.password, 10);
        needsUpdate = true;
        hashedCount++;
        console.log(`Hashing password for user ${user.id}`);
    }

    if (needsUpdate) {
        db.prepare('UPDATE users SET password = ?, isActive = ? WHERE id = ?').run(newPassword, newIsActive, user.id);
    }
});

console.log(`\nMigration complete!`);
console.log(`- Fixed isActive for ${activeFixed} users`);
console.log(`- Hashed passwords for ${hashedCount} users`);
console.log(`- Total users processed: ${users.length}`);
