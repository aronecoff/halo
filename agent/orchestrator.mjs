#!/usr/bin/env node

/**
 * Halo Agent Orchestrator
 *
 * Polls GitHub Issues labeled "ready", runs Claude Code headless
 * against each task, and opens PRs with the results.
 *
 * Usage:
 *   node orchestrator.mjs           # Process one issue, then exit
 *   node orchestrator.mjs --loop    # Poll every 30 min
 */

import { execSync, spawn } from "child_process";

const REPO = "aronecoff/halo";
const MAIN_BRANCH = "main";
const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const CLAUDE_TIMEOUT_MS = 10 * 60 * 1000; // 10 min per task
const WORKING_DIR = process.env.HALO_REPO_PATH || process.cwd();

// ─── GitHub Helpers ────────────────────────────────────

function gh(args) {
  return execSync(`gh ${args}`, { encoding: "utf-8", cwd: WORKING_DIR }).trim();
}

function git(args) {
  return execSync(`git ${args}`, { encoding: "utf-8", cwd: WORKING_DIR }).trim();
}

function getReadyIssues() {
  try {
    const json = gh(
      `issue list --repo ${REPO} --label ready --state open --json number,title,body,labels --limit 10`
    );
    const issues = JSON.parse(json);

    // Sort by priority label (priority:1 first)
    issues.sort((a, b) => {
      const prioA = getPriority(a);
      const prioB = getPriority(b);
      return prioA - prioB;
    });

    return issues;
  } catch (e) {
    console.error("Failed to fetch issues:", e.message);
    return [];
  }
}

function getPriority(issue) {
  for (const label of issue.labels || []) {
    const match = label.name?.match(/^priority:(\d)$/);
    if (match) return parseInt(match[1]);
  }
  return 99; // no priority = last
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

// ─── Claude Code Runner ────────────────────────────────

function runClaudeCode(prompt) {
  return new Promise((resolve, reject) => {
    const args = [
      "claude",
      "--print",        // non-interactive, output only
      "--dangerously-skip-permissions", // headless mode
      "-p", prompt,
    ];

    console.log(`  Running: npx ${args.join(" ").slice(0, 80)}...`);

    const proc = spawn("npx", args, {
      cwd: WORKING_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: CLAUDE_TIMEOUT_MS,
      env: { ...process.env, CLAUDE_CODE_MAX_TURNS: "50" },
    });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));

    proc.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`Claude Code exited ${code}: ${stderr.slice(-500)}`));
    });

    proc.on("error", reject);
  });
}

// ─── Process a Single Issue ────────────────────────────

async function processIssue(issue) {
  const { number, title, body } = issue;
  const branch = `agent/${number}-${slugify(title)}`;

  console.log(`\n--- Processing #${number}: ${title} ---`);

  // Mark as in-progress
  try {
    gh(`issue edit ${number} --repo ${REPO} --add-label in-progress --remove-label ready`);
  } catch (e) {
    console.warn("  Could not update labels:", e.message);
  }

  try {
    // Ensure we're on a clean main
    git(`checkout ${MAIN_BRANCH}`);
    git(`pull origin ${MAIN_BRANCH}`);
    git(`checkout -b ${branch}`);

    // Build the prompt for Claude
    const prompt = buildPrompt(number, title, body);

    // Run Claude Code
    await runClaudeCode(prompt);

    // Check if there are actual changes
    const status = git("status --porcelain");
    if (!status) {
      console.log("  No changes produced. Skipping PR.");
      git(`checkout ${MAIN_BRANCH}`);
      git(`branch -D ${branch}`);
      gh(`issue edit ${number} --repo ${REPO} --add-label needs-clarification --remove-label in-progress`);
      return;
    }

    // Stage, commit, push
    git("add -A");
    git(`commit -m "agent: ${title} (closes #${number})"`);
    git(`push -u origin ${branch}`);

    // Open PR
    const prBody = [
      `## Automated PR for #${number}`,
      "",
      `**Issue:** ${title}`,
      "",
      "This PR was generated autonomously by the Halo Agent.",
      "Review carefully before merging.",
      "",
      `Closes #${number}`,
    ].join("\n");

    const prUrl = gh(
      `pr create --repo ${REPO} --base ${MAIN_BRANCH} --head ${branch} --title "${title}" --body "${prBody.replace(/"/g, '\\"')}"`
    );
    console.log(`  PR created: ${prUrl}`);

    // Update issue labels
    gh(`issue edit ${number} --repo ${REPO} --add-label agent-done --remove-label in-progress`);
  } catch (e) {
    console.error(`  Failed on #${number}:`, e.message);
    // Clean up
    try {
      git(`checkout ${MAIN_BRANCH}`);
      git(`branch -D ${branch}`);
    } catch { /* ignore cleanup errors */ }
    // Mark issue as failed
    try {
      gh(`issue edit ${number} --repo ${REPO} --add-label agent-failed --remove-label in-progress`);
      gh(`issue comment ${number} --repo ${REPO} --body "Agent failed: ${e.message.slice(0, 200)}"`);
    } catch { /* ignore */ }
  }
}

function buildPrompt(number, title, body) {
  return `You are working on the Halo dating app codebase.

## Task
GitHub Issue #${number}: ${title}

## Requirements
${body || "No additional details provided."}

## Instructions
- Work in the \`app/\` directory (Next.js web app) unless the issue specifies mobile
- Run \`npm test\` after making changes to ensure nothing breaks
- Write tests for any new logic you add in \`src/lib/\`
- Keep changes focused — only modify what the issue asks for
- Do NOT modify package.json dependencies without explicit instruction
- Do NOT touch environment variables or secrets
- If the task is unclear or impossible, create a file \`AGENT_NOTES.md\` explaining why`;
}

// ─── Main Loop ─────────────────────────────────────────

async function run() {
  console.log(`[${new Date().toISOString()}] Checking for ready issues...`);

  const issues = getReadyIssues();
  if (issues.length === 0) {
    console.log("No ready issues found.");
    return;
  }

  console.log(`Found ${issues.length} ready issue(s). Processing first one.`);

  // Process one issue per run (safer — let CI validate before moving on)
  await processIssue(issues[0]);
}

async function main() {
  const loopMode = process.argv.includes("--loop");

  await run();

  if (loopMode) {
    console.log(`\nLoop mode: polling every ${POLL_INTERVAL_MS / 60000} minutes.`);
    setInterval(run, POLL_INTERVAL_MS);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
