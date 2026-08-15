#!/bin/bash
# Dual-history synchronization script
set -e

# Make sure we are in the repository root
cd "$(dirname "$0")"

COMMIT_MSG=${1:-"Sync changes"}
COMMIT_BODY=${2:-""}

if [ -f .env ]; then
    export $(cat .env | xargs)
fi

ANTAMAINE_URL="https://antAmaine:${ANTAMAINE_TOKEN}@github.com/antAmaine/RPGX-Translation-Tool.git"

echo "=== 1. Committing to PUBLIC repository (taimanintrash) ==="
git add .
if ! git diff-index --quiet HEAD; then
    if [ -n "$COMMIT_BODY" ]; then
        GIT_COMMITTER_NAME="taimanintrash" GIT_COMMITTER_EMAIL="taimanintrash@gmail.com" \
        git commit -m "$COMMIT_MSG" -m "$COMMIT_BODY" --author="taimanintrash <taimanintrash@gmail.com>"
    else
        GIT_COMMITTER_NAME="taimanintrash" GIT_COMMITTER_EMAIL="taimanintrash@gmail.com" \
        git commit -m "$COMMIT_MSG" --author="taimanintrash <taimanintrash@gmail.com>"
    fi
else
    echo "No local changes to commit to the public repo."
fi
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Pushing to public repo (branch: $CURRENT_BRANCH)..."
git push origin "$CURRENT_BRANCH"

echo ""
echo "=== 2. Cloning antAmaine repo to a fresh temp folder ==="
TEMP_DIR=$(mktemp -d)
git clone --depth 1 "$ANTAMAINE_URL" "$TEMP_DIR/antAmaine"

echo ""
echo "=== 3. Copying current files into antAmaine clone ==="
rsync -a \
  --exclude='.git' \
  --exclude='.git_*' \
  --exclude='dual_sync.sh' \
  . "$TEMP_DIR/antAmaine/"

echo ""
echo "=== 4. Committing snapshot to PRIVATE repository (antAmaine) ==="
cd "$TEMP_DIR/antAmaine"
git add .
if ! git diff-index --quiet HEAD; then
    if [ -n "$COMMIT_BODY" ]; then
        GIT_COMMITTER_NAME="Anthony" GIT_COMMITTER_EMAIL="anthony.weaver@maine.edu" \
        git commit -m "Snapshot: $COMMIT_MSG" -m "$COMMIT_BODY" --author="Anthony <anthony.weaver@maine.edu>"
    else
        GIT_COMMITTER_NAME="Anthony" GIT_COMMITTER_EMAIL="anthony.weaver@maine.edu" \
        git commit -m "Snapshot: $COMMIT_MSG" --author="Anthony <anthony.weaver@maine.edu>"
    fi
    echo "Pushing to school backup..."
    git push
else
    echo "No changes needed for the school backup."
fi

echo ""
echo "=== 5. Cleaning up temp folder ==="
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Success! Both histories have been updated and pushed perfectly isolated."
