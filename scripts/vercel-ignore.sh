#!/bin/bash

# Vercel Ignore Build Script
# Exit 0 = Skip build, Exit 1 = Build
#
# Environment variables from Vercel:
# - VERCEL_GIT_COMMIT_REF: Branch name
# - VERCEL_ENV: production, preview, or development
#
# Usage in Vercel Project Settings > Git > Ignored Build Step:
# bash scripts/vercel-ignore.sh [project-type]
#
# Project types: web, testnet, docs

PROJECT_TYPE="${1:-web}"
BRANCH="$VERCEL_GIT_COMMIT_REF"

echo "Branch: $BRANCH"
echo "Project: $PROJECT_TYPE"
echo "Environment: $VERCEL_ENV"

# Always skip dependabot branches (dependency updates)
if [[ "$BRANCH" == dependabot/* ]]; then
  echo "Skipping dependabot branch: $BRANCH"
  exit 0
fi

case "$PROJECT_TYPE" in
  "docs")
    # Always skip docs builds (fumadocs is broken)
    echo "Skipping docs build (temporarily disabled)"
    exit 0
    ;;

  "testnet")
    # Build testnet on main branch
    if [[ "$BRANCH" == "main" ]]; then
      echo "Building testnet from main branch"
      exit 1
    else
      echo "Skipping testnet build on branch: $BRANCH"
      exit 0
    fi
    ;;

  "web"|"mainnet")
    # Build mainnet/web on main branch
    if [[ "$BRANCH" == "main" ]]; then
      echo "Building web from main branch"
      exit 1
    else
      echo "Skipping web build on branch: $BRANCH"
      exit 0
    fi
    ;;

  *)
    echo "Unknown project type: $PROJECT_TYPE"
    echo "Proceeding with build"
    exit 1
    ;;
esac
