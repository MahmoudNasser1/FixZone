#!/bin/bash

# Script to restore to stable commit "بعد تعديلات الامان"
# Commit ID: 4a96aa5b58a7d13fe4cc7c18c5932820f278fbfe

set -e

COMMIT_ID="4a96aa5b58a7d13fe4cc7c18c5932820f278fbfe"
COMMIT_SHORT="4a96aa5"
BRANCH_NAME="restore-stable-$(date +%Y%m%d)"

echo "=========================================="
echo "Restore to Stable Commit"
echo "Commit: $COMMIT_SHORT - بعد تعديلات الامان"
echo "=========================================="
echo ""

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "📂 Project directory: $PROJECT_ROOT"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository!"
    exit 1
fi

# Check if commit exists
if ! git cat-file -e "$COMMIT_ID" 2>/dev/null; then
    echo "❌ Error: Commit $COMMIT_SHORT not found!"
    echo "Fetching from remote..."
    git fetch origin
    if ! git cat-file -e "$COMMIT_ID" 2>/dev/null; then
        echo "❌ Commit still not found after fetch!"
        exit 1
    fi
fi

echo "✅ Commit found: $COMMIT_SHORT"
echo ""

# Check current status
echo "📋 Current git status:"
git status --short
echo ""

# Ask for confirmation
read -p "⚠️  This will create a new branch from commit $COMMIT_SHORT. Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 1
fi

# Save current changes
echo ""
echo "💾 Saving current changes..."
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Uncommitted changes found. Stashing..."
    git stash push -m "Auto-stash before restore to $COMMIT_SHORT - $(date)"
    echo "✅ Changes saved to stash"
else
    echo "✅ No uncommitted changes"
fi

# Create new branch from stable commit
echo ""
echo "🌿 Creating branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME" "$COMMIT_ID"

echo ""
echo "✅ Successfully checked out to commit $COMMIT_SHORT"
echo ""
echo "📋 Current commit:"
git log --oneline -3

echo ""
echo "=========================================="
echo "✅ Restore complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review changes: git log --oneline"
echo "2. Push branch: git push origin $BRANCH_NAME"
echo "3. On VPS: git fetch && git checkout $BRANCH_NAME"
echo ""
echo "To restore previous changes: git stash list && git stash pop"
echo ""

