#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

echo "======================================"
echo "⚡ Ecommerce Frontend Pre-commit"
echo "======================================"

echo "[1/3] Checking staged file line limits..."
STAGED_FILES=$(git -C "$ROOT_DIR" diff --cached --name-only --diff-filter=d | grep -E '.*\.(ts|tsx|js|jsx)$' || true)

if [[ -n "$STAGED_FILES" ]]; then
  VIOLATION=false
  while IFS= read -r FILE; do
    [[ -z "$FILE" ]] && continue
    if [[ -f "$ROOT_DIR/$FILE" ]]; then
      CURRENT_LINES=$(wc -l < "$ROOT_DIR/$FILE" | tr -d ' ')
      TRACKED_IN_HEAD=false
      PREVIOUS_LINES=0
      if git -C "$ROOT_DIR" cat-file -e "HEAD:$FILE" 2>/dev/null; then
        TRACKED_IN_HEAD=true
        PREVIOUS_LINES=$(git -C "$ROOT_DIR" show "HEAD:$FILE" | wc -l | tr -d ' ')
      fi
      if [[ "$CURRENT_LINES" -gt 1000 ]]; then
        if [[ "$TRACKED_IN_HEAD" == false ]]; then
          echo "❌ Error: '$FILE' has $CURRENT_LINES lines (limit: 1000)."
          VIOLATION=true
        else
          echo "⚠️  Warning: '$FILE' remains over the 1000-line limit ($CURRENT_LINES lines, previous $PREVIOUS_LINES)."
        fi
      fi
    fi
  done <<< "$STAGED_FILES"

  if [[ "$VIOLATION" == true ]]; then
    echo "❌ Pre-commit aborted due to oversized files."
    exit 1
  fi
fi
echo "✅ Line limit check passed."

echo "[2/3] Running typecheck..."
(
  cd "$ROOT_DIR"
  npm run typecheck
)
echo "✅ Typecheck passed."

echo "[3/3] Running quick build..."
(
  cd "$ROOT_DIR"
  npm run build
)
echo "✅ Ecommerce frontend pre-commit passed!"
