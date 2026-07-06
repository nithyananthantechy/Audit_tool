require('dotenv').config({ path: '../.env.production' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log('Migrating...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mfaSecret TEXT;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mfaEnabled SMALLINT DEFAULT 0;`;
    await sql`ALTER TABLE checklists ADD COLUMN IF NOT EXISTS framework TEXT;`;
    await sql`ALTER TABLE checklists ADD COLUMN IF NOT EXISTS control_clause TEXT;`;
    await sql`ALTER TABLE activity ADD COLUMN IF NOT EXISTS hash TEXT;`;
    await sql`ALTER TABLE activity ADD COLUMN IF NOT EXISTS previous_hash TEXT;`;
    console.log('Columns added!');
  } catch(e) {
    console.error(e);
  }
}
run();
