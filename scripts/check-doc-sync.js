const { execSync } = require("child_process");
const readline = require("readline");

/**
 * check-doc-sync.js
 * Git Pre-Commit Hook Script
 * Detects manual edits to backend controller/model files and prompts the developer
 * to confirm or update corresponding AI documentation in ai_documents/.
 */
function runDocSyncCheck() {
  try {
    // 1. Get list of staged files in git
    const stagedFilesOutput = execSync("git diff --cached --name-only", { encoding: "utf8" });
    const stagedFiles = stagedFilesOutput.split("\n").filter(Boolean);

    // 2. Identify backend code changes & AI document changes
    const codeChanges = stagedFiles.filter(file =>
      file.startsWith("api/controller/") ||
      file.startsWith("models/") ||
      file.startsWith("routes/")
    );

    const docChanges = stagedFiles.filter(file =>
      file.startsWith("ai_documents/")
    );

    // If backend code was modified BUT ai_documents/ was NOT modified
    if (codeChanges.length > 0 && docChanges.length === 0) {
      console.log("\n=======================================================");
      console.log("⚠️  AI DOC SYNC WARNING: Backend Code Changes Detected!");
      console.log("=======================================================");
      console.log("The following backend files were modified:");
      codeChanges.forEach(f => console.log(`  • ${f}`));
      console.log("-------------------------------------------------------");
      console.log("No changes were staged in 'ai_documents/'.");
      console.log("Please ensure business logic and security rules are updated.\n");

      // Check if running in interactive terminal (TTY)
      if (process.stdin.isTTY) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        rl.question("Would you like to proceed with the commit anyway? [y/N]: ", (answer) => {
          rl.close();
          const cleanAns = answer.trim().toLowerCase();
          if (cleanAns === "y" || cleanAns === "yes") {
            console.log("✅ Proceeding with git commit...\n");
            process.exit(0);
          } else {
            console.log("❌ Commit cancelled. Please update 'ai_documents/' and stage your changes.\n");
            process.exit(1);
          }
        });
        return;
      } else {
        console.log("💡 Non-interactive terminal detected. Allowing commit, but remember to update 'ai_documents/'.\n");
        process.exit(0);
      }
    }

    console.log("✅ Doc Sync Check: Documentation is in sync.");
    process.exit(0);
  } catch (err) {
    // If not a git repository or error executing git command, exit 0
    process.exit(0);
  }
}

runDocSyncCheck();
