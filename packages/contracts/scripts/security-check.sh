#!/bin/bash

# KhipuVault Security Check Script
# Free Security Tools Suite
# Date: 2026-02-07

set -e

echo "============================================"
echo "🔒 KhipuVault Security Analysis (FREE Tools)"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Slither Static Analysis (Already installed)
echo -e "${YELLOW}📊 Running Slither Static Analysis...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
slither . --exclude-dependencies \
    --exclude-informational \
    --exclude-low \
    --filter-paths "test|lib|script" \
    --json slither-report.json || true
echo -e "${GREEN}✓ Slither analysis complete${NC}"
echo ""

# 2. Foundry Gas Snapshot
echo -e "${YELLOW}⛽ Generating Gas Snapshot...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
forge snapshot --gas-report --snap .gas-snapshot || true
echo -e "${GREEN}✓ Gas snapshot saved to .gas-snapshot${NC}"
echo ""

# 3. Foundry Coverage
echo -e "${YELLOW}📈 Generating Test Coverage Report...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
forge coverage --report summary || true
echo -e "${GREEN}✓ Coverage report complete${NC}"
echo ""

# 4. Check for common vulnerabilities
echo -e "${YELLOW}🔍 Checking Common Vulnerabilities...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for selfdestruct (dangerous)
echo -n "- Checking for selfdestruct... "
if grep -r "selfdestruct" src/ --include="*.sol" > /dev/null 2>&1; then
    echo -e "${RED}FOUND${NC}"
else
    echo -e "${GREEN}✓ SAFE${NC}"
fi

# Check for delegatecall (careful usage required)
echo -n "- Checking for delegatecall... "
if grep -r "delegatecall" src/ --include="*.sol" > /dev/null 2>&1; then
    echo -e "${YELLOW}FOUND (review usage)${NC}"
else
    echo -e "${GREEN}✓ SAFE${NC}"
fi

# Check for tx.origin (should use msg.sender)
echo -n "- Checking for tx.origin... "
if grep -r "tx\.origin" src/ --include="*.sol" > /dev/null 2>&1; then
    echo -e "${RED}FOUND (use msg.sender)${NC}"
else
    echo -e "${GREEN}✓ SAFE${NC}"
fi

# Check for unchecked external calls
echo -n "- Checking for low-level calls... "
LOW_LEVEL=$(grep -r "\.call\|\.delegatecall\|\.staticcall" src/ --include="*.sol" | wc -l)
if [ $LOW_LEVEL -gt 0 ]; then
    echo -e "${YELLOW}FOUND ($LOW_LEVEL instances - review)${NC}"
else
    echo -e "${GREEN}✓ SAFE${NC}"
fi

# Check ReentrancyGuard coverage
echo -n "- Checking ReentrancyGuard coverage... "
NONREENTRANT=$(grep -r "nonReentrant" src/ --include="*.sol" | wc -l)
echo -e "${GREEN}✓ $NONREENTRANT protected functions${NC}"

echo ""

# 5. Install Aderyn (Rust-based analyzer) if not already installed
echo -e "${YELLOW}🦀 Checking Aderyn (Rust Analyzer)...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if ! command -v aderyn &> /dev/null; then
    echo "Aderyn not found. Install with: cargo install aderyn"
    echo "Skipping Aderyn analysis..."
else
    echo "Running Aderyn analysis..."
    aderyn . --output aderyn-report.md || true
    echo -e "${GREEN}✓ Aderyn report saved to aderyn-report.md${NC}"
fi
echo ""

# 6. Summary
echo "============================================"
echo -e "${GREEN}✅ Security Analysis Complete${NC}"
echo "============================================"
echo ""
echo "Generated Reports:"
echo "  📄 slither-report.json      - Slither findings"
echo "  ⛽ .gas-snapshot             - Gas usage per function"
echo "  📈 Coverage (console output) - Test coverage stats"
echo "  🦀 aderyn-report.md          - Aderyn findings (if installed)"
echo ""
echo "Next Steps:"
echo "  1. Review slither-report.json for vulnerabilities"
echo "  2. Check gas snapshot for optimization opportunities"
echo "  3. Increase test coverage to 80%+"
echo "  4. Install Mythril for symbolic execution: pip install mythril"
echo "  5. Consider professional audit before mainnet"
echo ""
echo "Free Tools to Install:"
echo "  • Aderyn:  cargo install aderyn"
echo "  • Mythril: pip install mythril"
echo "  • Echidna: Install from github.com/crytic/echidna"
echo ""
