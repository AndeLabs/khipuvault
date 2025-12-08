#!/bin/bash
# Stop hook: Verify TypeScript types before completing

set -e

echo "Running type check..."
pnpm typecheck 2>&1 | head -30

exit 0  # Don't block, just report
