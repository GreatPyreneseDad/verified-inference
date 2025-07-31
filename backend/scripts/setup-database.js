const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://verified_inference_user:M43KkkNzoOrWekwZIZ5E7Z0iuGHdzZgl@dpg-d25eounfte5s738440jg-a.virginia-postgres.render.com:5432/verified_inference',
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../database/complete_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons but be careful with functions
    const statements = sql
      .split(/;(?=\s*(?:--|CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|SELECT|$))/gi)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Running ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`Running statement ${i + 1}/${statements.length}...`);
          await pool.query(statement + ';');
        } catch (err) {
          console.error(`Error in statement ${i + 1}:`, err.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\nTables created:');
    result.rows.forEach(row => console.log(`- ${row.table_name}`));
    
    console.log('\nDatabase setup complete! ✅');
    console.log('You can now register users on your frontend.');
    
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();