# Halo Agent — Autonomous Dev Worker

This directory contains the orchestration script that runs on the Mac Mini.
It polls GitHub Issues tagged `ready`, picks up tasks, and opens PRs via Claude Code.

## Setup (Mac Mini)

```bash
# 1. Install dependencies
brew install node gh
npm install -g @anthropic-ai/claude-code

# 2. Authenticate
gh auth login
export ANTHROPIC_API_KEY="sk-ant-..."

# 3. Clone the repo
git clone https://github.com/aronecoff/halo.git ~/halo
cd ~/halo

# 4. Install agent deps
cd agent && npm install

# 5. Run once
node orchestrator.mjs

# 6. Set up as a launchd daemon (runs every 30 min)
cp com.halo.agent.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.halo.agent.plist
```

## How It Works

1. Polls GitHub for issues labeled `ready` + `priority:1` (then `priority:2`, etc.)
2. For each issue, creates a branch `agent/<issue-number>-<slug>`
3. Runs Claude Code headless with the issue body as the task prompt
4. Commits changes and opens a PR linking the issue
5. CI must pass before the PR is mergeable (branch protection)
6. You review on your phone, approve or request changes

## Labels

- `ready` — Issue is fully specified and ready for the agent to pick up
- `priority:1` through `priority:3` — Processing order
- `in-progress` — Agent is currently working on this (auto-applied)
- `agent-done` — PR opened, waiting for review (auto-applied)
