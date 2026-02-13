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
  // 🧠 Refactor Model (Claude)
  // Options: "claude-opus-4-6" (Beta), "claude-3-opus-20240229" (Stable), "claude-3-5-sonnet-20240620" (Fast)
  model_refactor: "claude-opus-4-6", 
  
  // 📘 Documentation Model (Gemini)
  model_doc: "gemini-2.0-flash", 
  
  // 📚 Embedding Model
model_embed: "gemini-embedding-001",

  base_dir: process.cwd(),
  prompts_file: path.join(process.cwd(), 'PROMPTS.md'),
  checkpoint_file: path.join(process.cwd(), '.refactor-checkpoint.json'),
};

// --- Clients ---
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- 💾 Progress Manager (The Save System) ---
class ProgressManager {
  private data: { done: string[]; errors: Record<string, string> };

  constructor() {
    if (fs.existsSync(CONFIG.checkpoint_file)) {
      this.data = JSON.parse(fs.readFileSync(CONFIG.checkpoint_file, 'utf-8'));
    } else {
      this.data = { done: [], errors: {} };
    }
  }

  isDone(filePath: string): boolean {
    return this.data.done.includes(filePath);
  }

  markDone(filePath: string) {
    if (!this.data.done.includes(filePath)) {
      this.data.done.push(filePath);
      delete this.data.errors[filePath];
      this.save();
    }
  }

  logError(filePath: string, errorMsg: string) {
    this.data.errors[filePath] = errorMsg;
    this.save();
  }

  private save() {
    fs.writeFileSync(CONFIG.checkpoint_file, JSON.stringify(this.data, null, 2));
  }

  getStats() {
    return { 
      completed: this.data.done.length, 
      failed: Object.keys(this.data.errors).length 
    };
  }
}

// --- 🛡️ Helper: Smart Retry Wrapper ---
async function safeExecute<T>(
  operation: () => Promise<T>, 
  retries = 5, 
  delay = 10000 
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if ((error.status === 429 || error.status === 529) && retries > 0) {
      console.warn(`   ⚠️ Rate Limit Hit (${error.status}). Cooling down for ${delay/1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      return safeExecute(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// --- 🕵️‍♀️ Phase 1: Claude Refactor (Empty Vessel) ---
async function refactorWithClaude(filename: string, code: string, masterPrompt: string) {
  const msg = await anthropic.messages.create({
    model: CONFIG.model_refactor,
    max_tokens: 6000,
    // "Empty Vessel" Strategy: We ONLY inject the masterPrompt.
    // This prevents "Persona Drift" where conflicting system prompts confuse the AI.
    system: `
${masterPrompt}

---

IMMEDIATE TASK:
Refactor the code provided by the user below. 
Apply the "Simplicity" and "Security" standards defined above.

🛑 CRITICAL CONSTRAINT:
You are editing a SINGLE file: ${filename}.
You CANNOT create new files or move code to other packages during this step.
If you extract pure logic, define it as an exported function AT THE TOP of this same file.
Do not output multiple file blocks.

OUTPUT FORMAT:
Return ONLY the refactored code for ${filename}.
    `,
    messages: [{ role: "user", content: `Refactor this file: ${filename}\n\n${code}` }]
  });

  const textBlock = msg.content.find(c => c.type === 'text');
  return textBlock?.text || code; 
}

// --- ✍️ Phase 2: Gemini Docs ---
async function documentWithGemini(filename: string, code: string) {
  const model = googleAI.getGenerativeModel({ model: CONFIG.model_doc });
  const result = await model.generateContent(`
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
    [Mention RLS, Auth, or key constraints]
    ---
    CODE:
    ${code}
  `);
  return result.response.text();
}

// --- 🧠 Phase 3: Gemini Vectors ---
async function vectorizeAndSave(filePath: string, chapterContent: string) {
  const model = googleAI.getGenerativeModel({ model: CONFIG.model_embed });
  const result = await model.embedContent(chapterContent);
  await supabase.from('code_embeddings').delete().eq('file_path', filePath);
  await supabase.from('code_embeddings').insert({
    file_path: filePath,
    content: chapterContent,
    embedding: result.embedding.values
  });
}

async function main() {
  const progress = new ProgressManager();
  
  // 1. Load Prompt (Strict Check)
  let masterPrompt = "";
  try {
    if (!fs.existsSync(CONFIG.prompts_file)) {
      throw new Error(`PROMPTS.md not found at ${CONFIG.prompts_file}`);
    }
    masterPrompt = fs.readFileSync(CONFIG.prompts_file, 'utf-8');
    console.log("✅ Loaded Master Prompt");
  } catch (e: any) {
    console.error(`🛑 FATAL: ${e.message}`);
    process.exit(1);
  }

  // 2. Select Files 
  const allFiles = await glob('apps/web/**/*.{ts,tsx}', {
    ignore: [
      '**/node_modules/**', 
      '**/.next/**',         // Next.js build folder
      '**/dist/**',
      '**/*.d.ts', 
      '**/*.test.ts',
    ],
    cwd: CONFIG.base_dir,
  });

  // Filter out files already done
  const filesToDo = allFiles.filter(f => !progress.isDone(f));
  
  // 🛑 PROBE MODE: Overwrite to test ONLY ONE file first
  // Comment this line out when you are ready for the full run!
  // const batch = ['apps/mobile/utils/security.ts'];
  const batch = filesToDo; // <--- Use this for the full run

  console.log(`🚀 Starting Run: ${batch.length} files to process...`);
  const manualPath = path.join(CONFIG.base_dir, 'THE_WAY_MANUAL.md');

  for (const file of batch) {
    console.log(`\n📂 Processing: ${file}`);
    
    if (!fs.existsSync(file)) {
      console.error(`   ❌ File missing: ${file}`);
      continue;
    }

    const originalCode = fs.readFileSync(file, 'utf-8');

    try {
      // Step A: Refactor
      process.stdout.write("   🤖 Refactoring...");
      const refactoredCode = await safeExecute(() => 
        refactorWithClaude(file, originalCode, masterPrompt)
      );
      
      if (refactoredCode !== originalCode) {
        fs.writeFileSync(file, refactoredCode);
        process.stdout.write(" [Saved] ✅\n");
      } else {
        process.stdout.write(" [No Changes] ✅\n");
      }

      // Step B: Document
      process.stdout.write("   📘 Documenting...");
      const chapter = await safeExecute(() => 
        documentWithGemini(file, refactoredCode)
      );
      fs.appendFileSync(manualPath, chapter + '\n\n');
      process.stdout.write(" ✅\n");

      // Step C: Gemini Vectorizing (Soft Fail)
      process.stdout.write("   🧠 Vectorizing...");
      try {
        // Try to vectorize, but don't crash if it fails
        await safeExecute(() => 
          vectorizeAndSave(file, chapter)
        );
        process.stdout.write(" ✅\n");
      } catch (e: any) {
        // 🟡 WARNING ONLY: Do not stop the pipeline!
        process.stdout.write(" ⚠️ SKIPPED\n");
        console.warn(`      [Warning]: Vectorization failed (${e.message.split('[')[0]}). Continuing...`);
      }

      // 🎉 MARK DONE
      progress.markDone(file);

    } catch (e: any) {
      console.error(`\n   🔥 Failed:`, e.message);
      if (e.status === 404) console.error("      HINT: Check if Model ID is correct.");
      progress.logError(file, e.message);
    }
  }

  console.log(`\n✨ Run Complete. Stats: ${JSON.stringify(progress.getStats())}`);
}

main();