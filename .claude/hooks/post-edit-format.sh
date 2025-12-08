#!/bin/bash
# Post-edit hook: Format edited files with Prettier

set -e

if [ -n "$CLAUDE_FILE_PATH" ]; then
  # Format the specific file that was edited
  pnpm prettier --write "$CLAUDE_FILE_PATH" 2>/dev/null || true
fi
