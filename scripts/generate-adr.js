require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Setup Gemini
// Ensure GEMINI_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Using 1.5-pro for better context handling

async function main() {
  console.log("🤖 Auto-Architect: Analyzing your commit...");

  // 2. Get the diff from the last commit
  // LIMITATION: If diff is too huge, we truncate it to fit context window
  let diff = "";
  try {
    diff = execSync('git diff HEAD~1 HEAD').toString();
    if (diff.length > 50000) { // Increased limit for 1.5 pro
      console.warn("⚠️  Diff is large. Truncating for AI analysis...");
      diff = diff.substring(0, 50000) + "\n...[TRUNCATED]";
    }
  } catch (e) {
    console.error("❌ Could not read git diff. Make sure you have commits.");
    return;
  }

  if (!diff.trim()) {
    console.log("ℹ️  Empty diff. Skipping ADR.");
    return;
  }

  // 3. The Prompt (Same logic as your Master Prompt)
  const prompt = `
    You are the Lead Architect for "The Way" (Turborepo/Next.js/Expo).
    Analyze the following code changes (git diff) and generate a strictly formatted Architectural Decision Record (ADR).
    
    Format Constraints:
    - Use Markdown.
    - Filename suggestion at the top as: "# FILENAME: yyyy-mm-dd-short-slug.md"
    - The content should be compatible with standard ADR templates (Context, Decision, Consequences).
    - Sections: 
      - **Context**: What was the problem? What was the state before?
      - **Decision**: What did we change? Why?
      - **Consequences**: What are the trade-offs? (Positive/Negative)
      - **Compliance**: Security checks (Auth, RLS) and Observability.
    
    GIT DIFF:
    ${diff}
  `;

  // 4. Generate Content
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Parse and Save
    // Extract filename suggestion
    const filenameMatch = text.match(/# FILENAME: (.*)/);
    const filename = filenameMatch ? filenameMatch[1].trim() : `adr-${Date.now()}.md`;
    
    // Clean up the content (remove the filename line)
    const fileContent = text.replace(/# FILENAME: .*\n/, '');

    const adrDir = path.join(process.cwd(), 'docs', 'adr');
    if (!fs.existsSync(adrDir)) fs.mkdirSync(adrDir, { recursive: true });

    const filePath = path.join(adrDir, filename);
    fs.writeFileSync(filePath, fileContent);

    console.log(`✅ ADR Generated: docs/adr/${filename}`);
    console.log(`👉 Don't forget to commit this new file!`);
  } catch (error) {
    console.error("❌ Error generating ADR:", error);
  }
}

main().catch(console.error);
