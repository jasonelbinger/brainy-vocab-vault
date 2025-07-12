import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Setup database connection
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testSystem() {
  try {
    console.log('Testing database connection...');
    
    // Test templates
    const templates = await pool.query('SELECT * FROM card_templates ORDER BY id');
    console.log(`\nFound ${templates.rows.length} templates:`);
    templates.rows.forEach(template => {
      console.log(`- ${template.name} (ID: ${template.id}, Default: ${template.is_default})`);
    });
    
    // Test users
    const users = await pool.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 5');
    console.log(`\nFound ${users.rows.length} users:`);
    users.rows.forEach(user => {
      console.log(`- ${user.email || user.id} (Role: ${user.role})`);
    });
    
    // Test cards
    const cards = await pool.query('SELECT * FROM vocabulary_cards ORDER BY created_at DESC LIMIT 5');
    console.log(`\nFound ${cards.rows.length} vocabulary cards:`);
    cards.rows.forEach(card => {
      console.log(`- ${card.word} (User: ${card.user_id})`);
    });
    
    console.log('\nSystem test completed successfully!');
  } catch (error) {
    console.error('System test failed:', error);
  } finally {
    await pool.end();
  }
}

testSystem();