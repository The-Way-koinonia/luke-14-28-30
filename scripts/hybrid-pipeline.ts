import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// --- Configuration ---
const CONFIG = {
  // 🧠 The Architect (Refactoring)
  // SPECIFIC REQUEST: Using the beta/enterprise ID you found.
  // If this ID fails (404), revert to "claude-3-opus-20240229" or "claude-3-5-sonnet-20240620"
  model_refactor: "claude-opus-4-6", 
  
  // 📘 The Professor (Documentation)
  // Using Gemini 2.0 Flash for maximum context window and speed.
  model_doc: "gemini-2.0-flash", 
  
  // 📚 The Librarian (Vectors)
  model_embed: "text-embedding-004", 
  
  base_dir: process.cwd(),
  prompts_file: path.join(process.cwd(), 'PROMPTS.md'),
};

// --- Clients ---
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- 🛡️ Helper: Smart Retry Wrapper (Tier 1 Tuned) ---
async function safeExecute<T>(
  operation: () => Promise<T>, 
  retries = 5, // Increased retries for Opus
  delay = 10000 // Start with 10 seconds wait (Tier 1 safe)
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Check for Rate Limit (429) or Overloaded (529)
    if ((error.status === 429 || error.status === 529) && retries > 0) {
      console.warn(`   ⚠️ Rate Limit Hit (${error.status}). Cooling down for ${delay/1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      // Exponential Backoff: 10s -> 20s -> 40s -> 80s
      return safeExecute(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// --- 🕵️‍♀️ Phase 1: Claude Refactor ---
async function refactorWithClaude(filename: string, code: string, masterPrompt: string) {
  const msg = await anthropic.messages.create({
    model: CONFIG.model_refactor,
    max_tokens: 6000,
    system: `
      ${masterPrompt}

      ---
      
      IMMEDIATE TASK:
      Refactor the code provided by the user below. 
      Apply the "Simplicity" and "Security" standards defined above.
      
      OUTPUT FORMAT:
      Return ONLY the refactored code. Do not include markdown blocks like \`\`\`typescript if not necessary, just the raw code is preferred, or standard markdown. 
      NO conversational filler (e.g. "Here is the code").
    `,
    messages: [{ role: "user", content: `Refactor this file: ${filename}\n\n${code}` }]
  });

  const textBlock = msg.content.find(c => c.type === 'text');
  return textBlock?.text || code; 
}

// --- ✍️ Phase 2: The "Gemini" Documentation ---
async function documentWithGemini(filename: string, code: string) {
  const model = googleAI.getGenerativeModel({ model: CONFIG.model_doc });
  
  const prompt = `
    ROLE: Senior Technical Writer.
    TASK: Write a "Textbook Chapter" for the developer manual based on this code.
    
    FILE: ${filename}
    
    FORMAT:
    ## 📖 Chapter: ${path.basename(filename)}
    **Type:** (Service | Repository | Component)
    **Summary:** [1 sentence why this exists]
    
    ### 🔄 Data Flow
    * **Ingress:** [Where data enters]
    * **Egress:** [Where data leaves]
    
    ### 🧠 Logic
    [Explain strictly how it works]
    
    ### 🛡️ Safety & Config
    [Mention RLS, Auth, or key constraints found]
    
    ---
    
    CODE:
    ${code}
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// --- 🧠 Phase 3: The "Gemini" Vectorization ---
async function vectorizeAndSave(filePath: string, chapterContent: string) {
  const model = googleAI.getGenerativeModel({ model: CONFIG.model_embed });
  
  const result = await model.embedContent(chapterContent);
  const embedding = result.embedding.values;

  await supabase.from('code_embeddings').delete().eq('file_path', filePath);
  
  const { error } = await supabase.from('code_embeddings').insert({
    file_path: filePath,
    content: chapterContent,
    embedding: embedding
  });

  if (error) console.error(`   ❌ Vector Save Failed:`, error.message);
}

async function main() {
  // 1. Load Master Prompt
  let masterPrompt = "";
  try {
    masterPrompt = fs.readFileSync(CONFIG.prompts_file, 'utf-8');
    console.log("✅ Loaded Master Prompt from PROMPTS.md");
  } catch (e) {
    console.error("⚠️ PROMPTS.md not found. Using default constraints.");
  }

  // 2. Scan Files (Future Proofing)
  let allFiles = await glob('packages/social-engine/src/*.ts', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.test.ts', '**/ui/**'],
    cwd: CONFIG.base_dir,
  });

  // 🛑 TEST MODE: Hardcoded Single File Probe
  const files = ['apps/mobile/utils/bibleDb.ts'];

  console.log(`🚀 TEST MODE: Processing ${files.length} file(s) with ${CONFIG.model_refactor}...`);
  const manualPath = path.join(CONFIG.base_dir, 'THE_WAY_MANUAL.md');

  for (const file of files) {
    console.log(`\n📂 Processing: ${file}`);
    
    // Check if file exists to prevent crash
    if (!fs.existsSync(file)) {
      console.error(`   ❌ File not found: ${file}`);
      continue;
    }

    const originalCode = fs.readFileSync(file, 'utf-8');

    try {
      // Step A: Claude Refactor (Protected)
      process.stdout.write("   🤖 Claude Refactoring...");
      const refactoredCode = await safeExecute(() => 
        refactorWithClaude(file, originalCode, masterPrompt)
      );
      
      if (refactoredCode !== originalCode) {
        fs.writeFileSync(file, refactoredCode);
        process.stdout.write(" [Updated File] ✅\n");
      } else {
        process.stdout.write(" [No Changes Needed] ✅\n");
      }

      // Step B: Gemini Documentation (Protected)
      process.stdout.write("   📘 Gemini Documenting...");
      const chapter = await safeExecute(() => 
        documentWithGemini(file, refactoredCode)
      );
      fs.appendFileSync(manualPath, chapter + '\n\n');
      process.stdout.write(" ✅\n");

      // Step C: Gemini Vectorizing (Protected)
      process.stdout.write("   🧠 Gemini Vectorizing...");
      await safeExecute(() => 
        vectorizeAndSave(file, chapter)
      );
      process.stdout.write(" ✅\n");

    } catch (e: any) {
      console.error(`\n   🔥 Failed on ${file}:`, e.message);
      if (e.status === 404) {
        console.error("      HINT: The Model ID 'claude-opus-4-6' might be invalid or not enabled for your key.");
      }
    }
  }
}

main();