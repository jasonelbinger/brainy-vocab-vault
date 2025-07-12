// Run this after deployment to initialize your production database
const { Pool } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function initializeDatabase() {
  try {
    console.log('Initializing production database...');
    
    // Create tables (Vercel should handle this automatically)
    console.log('✓ Database schema ready');
    
    // Initialize default templates
    const templates = [
      {
        name: "Classic Frayer Model",
        description: "Learn words by looking at what they mean, what makes them special, examples of when to use them, and examples of when NOT to use them.",
        isDefault: true,
        fields: [
          { id: "definition", name: "Definition", type: "textarea", required: true, order: 1 },
          { id: "characteristics", name: "Characteristics", type: "textarea", required: true, order: 2 },
          { id: "examples", name: "Examples", type: "textarea", required: true, order: 3 },
          { id: "nonExamples", name: "Non-Examples", type: "textarea", required: true, order: 4 }
        ]
      },
      {
        name: "Definition-Image-Sentence-Synonyms",
        description: "Learn words by writing what they mean, adding a picture, using them in a sentence, and finding words that mean the same thing.",
        isDefault: false,
        fields: [
          { id: "definition", name: "Definition", type: "textarea", required: true, order: 1 },
          { id: "image", name: "Visual Representation", type: "image", required: true, order: 2 },
          { id: "exampleSentence", name: "Example Sentence", type: "textarea", required: true, order: 3 },
          { id: "synonyms", name: "Synonyms/Antonyms", type: "textarea", required: true, order: 4 }
        ]
      },
      {
        name: "Prefix-Root-Suffix",
        description: "Break apart words into their pieces (beginning, middle, end) to understand how they work.",
        isDefault: false,
        fields: [
          { id: "prefix", name: "Prefix", type: "text", required: true, order: 1 },
          { id: "root", name: "Root Word", type: "text", required: true, order: 2 },
          { id: "suffix", name: "Suffix", type: "text", required: true, order: 3 },
          { id: "wordConstruction", name: "How Parts Create Meaning", type: "textarea", required: true, order: 4 }
        ]
      }
    ];
    
    // Insert templates
    for (const template of templates) {
      await pool.query(
        `INSERT INTO card_templates (name, description, is_default, fields) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (name) DO NOTHING`,
        [template.name, template.description, template.isDefault, JSON.stringify(template.fields)]
      );
    }
    
    console.log('✓ Templates initialized');
    console.log('🎉 Production database setup complete!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();