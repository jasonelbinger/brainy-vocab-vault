import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Setup database connection
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const templates = [
  {
    name: "Classic Frayer Model",
    description: "The traditional four-quadrant approach with definition, characteristics, examples, and visual aid. Perfect for deep vocabulary understanding.",
    is_default: true,
    fields: [
      { id: "definition", name: "Definition", type: "textarea", required: true, order: 1, placeholder: "What does this word mean?" },
      { id: "characteristics", name: "Characteristics", type: "textarea", required: true, order: 2, placeholder: "What are the key features or qualities?" },
      { id: "examples", name: "Examples", type: "textarea", required: true, order: 3, placeholder: "Real examples of this word in use" },
      { id: "visualAid", name: "Visual Aid", type: "image", required: false, order: 4, placeholder: "Add an image to help remember" },
      { id: "synonyms", name: "Synonyms", type: "textarea", required: false, order: 5, placeholder: "Words with similar meanings" }
    ]
  },
  {
    name: "Definition-Image-Synonyms",
    description: "Focus on core meaning with visual and word connections. Great for building vocabulary networks and associations.",
    is_default: false,
    fields: [
      { id: "definition", name: "Definition", type: "textarea", required: true, order: 1, placeholder: "What does this word mean?" },
      { id: "visualAid", name: "Visual Aid", type: "image", required: false, order: 2, placeholder: "Add an image that represents this word" },
      { id: "synonyms", name: "Synonyms", type: "textarea", required: true, order: 3, placeholder: "Words with similar meanings" },
      { id: "sentence", name: "Example Sentence", type: "textarea", required: true, order: 4, placeholder: "Use the word in a sentence" }
    ]
  },
  {
    name: "Prefix-Root-Suffix",
    description: "Break down word parts to understand meaning. Excellent for learning word families and building morphological awareness.",
    is_default: false,
    fields: [
      { id: "prefix", name: "Prefix", type: "text", required: false, order: 1, placeholder: "Word beginning (if any)" },
      { id: "root", name: "Root", type: "text", required: true, order: 2, placeholder: "Core part of the word" },
      { id: "suffix", name: "Suffix", type: "text", required: false, order: 3, placeholder: "Word ending (if any)" },
      { id: "definition", name: "Definition", type: "textarea", required: true, order: 4, placeholder: "What does this word mean?" },
      { id: "memoryDevice", name: "Memory Device", type: "textarea", required: false, order: 5, placeholder: "A trick to remember this word (like connecting the parts)" }
    ]
  }
];

async function initializeTemplates() {
  try {
    console.log('Initializing card templates...');
    
    for (const template of templates) {
      // Check if template already exists
      const existing = await pool.query('SELECT id FROM card_templates WHERE name = $1', [template.name]);
      
      if (existing.rows.length === 0) {
        // Insert new template
        await pool.query(
          'INSERT INTO card_templates (name, description, is_default, fields) VALUES ($1, $2, $3, $4)',
          [template.name, template.description, template.is_default, JSON.stringify(template.fields)]
        );
        console.log(`Created template: ${template.name}`);
      } else {
        console.log(`Template already exists: ${template.name}`);
      }
    }
    
    console.log('Template initialization complete!');
  } catch (error) {
    console.error('Error initializing templates:', error);
  } finally {
    await pool.end();
  }
}

initializeTemplates();