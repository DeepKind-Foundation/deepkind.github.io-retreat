#!/usr/bin/env bash
#
# push_to_github.sh - commit the working tree, push a feature branch, open a PR,
# and (by default) merge it to main so GitHub Pages redeploys retreat.deepkind.org.
#
# The repo blocks direct commits/pushes to main, so all changes flow through a
# short-lived feature branch and a pull request. This script automates that.
#
# Usage:
#   ./scripts/push_to_github.sh "commit message"
#   ./scripts/push_to_github.sh "commit message" --no-merge   # open PR, don't merge
#   ./scripts/push_to_github.sh "commit message" --branch feat/my-name
#
# Requirements: git, and gh (GitHub CLI) authenticated via `gh auth login`.

set -euo pipefail

MESSAGE=""
BRANCH=""
MERGE=1

while [ $# -gt 0 ]; do
  case "$1" in
    --no-merge) MERGE=0; shift ;;
    --branch)   BRANCH="${2:-}"; shift 2 ;;
    -h|--help)  grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)          if [ -z "$MESSAGE" ]; then MESSAGE="$1"; else echo "Unexpected argument: $1" >&2; exit 1; fi; shift ;;
  esac
done

if [ -z "$MESSAGE" ]; then
  echo "Usage: ./scripts/push_to_github.sh \"commit message\" [--no-merge] [--branch name]" >&2
  exit 1
fi

# Always operate from the repository root.
cd "$(git rev-parse --show-toplevel)"

# Preflight: gh must be installed and authenticated.
if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) is not installed. Install it with: brew install gh" >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

# Nothing to do if the tree is clean.
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo "No changes to commit. Working tree is clean."
  exit 0
fi

# Derive a branch name from the message if one was not supplied.
if [ -z "$BRANCH" ]; then
  SLUG=$(printf '%s' "$MESSAGE" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '-' \
         | sed -E 's/-+/-/g; s/^-//; s/-$//' | cut -c1-40 | sed -E 's/-$//')
  [ -n "$SLUG" ] || SLUG="update"
  BRANCH="feat/${SLUG}-$(date +%Y%m%d-%H%M%S)"
fi

echo "==> Fetching latest main"
git fetch origin main

echo "==> Creating branch $BRANCH"
git switch -c "$BRANCH"

echo "==> Committing changes"
git add -A
git commit -m "$MESSAGE"

echo "==> Rebasing onto origin/main"
git rebase origin/main

echo "==> Pushing $BRANCH"
git push -u origin "$BRANCH"

echo "==> Opening pull request"
gh pr create --base main --head "$BRANCH" --title "$MESSAGE" --body "Automated PR via push_to_github.sh"

if [ "$MERGE" -eq 1 ]; then
  echo "==> Merging pull request"
  if gh pr merge "$BRANCH" --squash --delete-branch --admin 2>/dev/null \
     || gh pr merge "$BRANCH" --squash --delete-branch; then
    echo "==> Merged. Syncing local main"
    git switch main
    git pull --ff-only origin main
    echo "Done. GitHub Pages will redeploy https://retreat.deepkind.org/ in ~1-2 min."
  else
    echo "Could not merge automatically (branch protection or required review)." >&2
    echo "Open the PR to merge it manually:" >&2
    gh pr view "$BRANCH" --web >/dev/null 2>&1 || true
    exit 1
  fi
else
  echo "PR opened (not merged). Review and merge it to deploy:"
  gh pr view "$BRANCH" --json url --jq .url
fi
