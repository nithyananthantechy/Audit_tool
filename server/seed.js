const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, 'audit.db');
const db = new Database(DB_FILE);

const departments = ['HR', 'IT', 'Operations', 'Finance', 'Marketing', 'Sales', 'Legal', 'Support'];
const roles = ['Contributor', 'Manager Approver', 'Super Admin'];

function generateRandomUser(index) {
    const depts = ['HR', 'IT', 'Operations', 'Finance', 'Marketing', 'Sales', 'Legal', 'Support'];
    const rolesList = ['Contributor', 'Manager Approver', 'Super Admin'];
    
    const dept = depts[Math.floor(Math.random() * depts.length)];
    const role = index < 5 ? 'Super Admin' : (index < 50 ? 'Manager Approver' : rolesList[Math.floor(Math.random() * 2)]);
    
    return {
        id: `user${index}`,
        name: `Employee ${index}`,
        email: `employee${index}@desicrew.in`,
        role: role,
        department: dept,
        isActive: 1,
        password: `Password${index}@`,
        isLocked: 0,
        loginAttempts: 0
    };
}

console.log('Seeding 1500 users...');

const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, role, department, isActive, password, isLocked, loginAttempts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((users) => {
    for (const user of users) {
        insertStmt.run(user.id, user.name, user.email, user.role, user.department, user.isActive, user.password, user.isLocked, user.loginAttempts);
    }
});

const users = [];
for (let i = 1; i <= 1500; i++) {
    users.push(generateRandomUser(i));
}

insertMany(users);

const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
console.log(`Database now has ${count.count} users`);
console.log('Done!');