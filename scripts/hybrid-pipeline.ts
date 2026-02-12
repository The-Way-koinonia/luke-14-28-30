import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Configuration ---
const CONFIG = {
  // 🧠 The Architect (Refactoring)
  model_refactor: "claude-3-opus-20240229", // Use "claude-opus-4.6" if available in your beta access
  
  // 📘 The Professor (Documentation)
  model_doc: "gemini-1.5-pro-latest", 
  
  // 📚 The Librarian (Vectors)
  model_embed: "embedding-001", 
  
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

// --- 🕵️‍♀️ Phase 1: The "Claude" Refactor ---
async function refactorWithClaude(filename: string, code: string, masterPrompt: string) {
  const msg = await anthropic.messages.create({
    model: CONFIG.model_refactor,
    max_tokens: 4096,
    system: `
      You are a Senior Staff Software Engineer. 
      Your only goal is to REFACTOR code based on the "Master Prompt" rules provided.
      
      RULES:
      ${masterPrompt}
      
      OUTPUT:
      Return ONLY the refactored code. No conversational filler. 
      If the code is already perfect, return the original code exactly.
    `,
    messages: [
      { role: "user", content: `Refactor this file: ${filename}\n\n${code}` }
    ]
  });

  // Extract text safely from the content block
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
  
  // 1. Get Embedding
  const result = await model.embedContent(chapterContent);
  const embedding = result.embedding.values;

  // 2. Save to Supabase (Overwrite old entry)
  await supabase.from('code_embeddings').delete().eq('file_path', filePath);
  
  const { error } = await supabase.from('code_embeddings').insert({
    file_path: filePath,
    content: chapterContent, // Store the explanation
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

  // 2. Scan Files
  let allFiles = await glob('packages/social-engine/src/*.ts', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.test.ts', '**/ui/**'],
    cwd: CONFIG.base_dir,
  });

  // 🛑 TEST MODE: Only take the first 3 files!
  const files = allFiles.slice(0, 3); 

  console.log(`🚀 TEST MODE: Processing ${files.length} files (out of ${allFiles.length} total)...`);
  const manualPath = path.join(CONFIG.base_dir, 'THE_WAY_MANUAL.md');

  for (const file of files) {
    console.log(`\n📂 Processing: ${file}`);
    const originalCode = fs.readFileSync(file, 'utf-8');

    try {
      // Step A: Claude Refactor
      process.stdout.write("   🤖 Claude Refactoring...");
      const refactoredCode = await refactorWithClaude(file, originalCode, masterPrompt);
      
      // Save Refactored Code to Disk (Overwrite)
      if (refactoredCode !== originalCode) {
        fs.writeFileSync(file, refactoredCode);
        process.stdout.write(" [Updated File] ✅\n");
      } else {
        process.stdout.write(" [No Changes Needed] ✅\n");
      }

      // Step B: Gemini Documentation
      process.stdout.write("   📘 Gemini Documenting...");
      const chapter = await documentWithGemini(file, refactoredCode);
      fs.appendFileSync(manualPath, chapter + '\n\n');
      process.stdout.write(" ✅\n");

      // Step C: Gemini Vectorizing
      process.stdout.write("   🧠 Gemini Vectorizing...");
      await vectorizeAndSave(file, chapter);
      process.stdout.write(" ✅\n");

    } catch (e) {
      console.error(`\n   🔥 Failed on ${file}:`, e);
    }

    console.log("   💤 Cooling down for 5 seconds...");
    await sleep(5000); // 5-second pause safeguards your Rate Limits
  }
}

main();