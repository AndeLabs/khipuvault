#!/usr/bin/env bash
#
# License Compliance Checker for KhipuVault
# Scans all dependencies for license compliance and generates reports
#

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${PROJECT_ROOT}/.licenserc.json"
REPORT_FILE="${PROJECT_ROOT}/license-report.json"
REPORT_MD="${PROJECT_ROOT}/license-report.md"

# License categories from config
ALLOWED_LICENSES=()
WARN_LICENSES=()
BLOCKED_LICENSES=()

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   KhipuVault License Compliance Check${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to load configuration
load_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        echo -e "${RED}Error: Configuration file not found: $CONFIG_FILE${NC}"
        exit 1
    fi

    echo -e "${BLUE}Loading configuration from $CONFIG_FILE...${NC}"

    # Parse JSON configuration using Node.js
    ALLOWED_LICENSES=($(node -p "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8')).allowedLicenses.join(' ')"))
    WARN_LICENSES=($(node -p "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8')).warnLicenses.join(' ')"))
    BLOCKED_LICENSES=($(node -p "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8')).blockedLicenses.join(' ')"))

    echo -e "${GREEN}Configuration loaded successfully${NC}"
    echo ""
}

# Function to check if package is in allowed list
is_allowed() {
    local license="$1"
    for allowed in "${ALLOWED_LICENSES[@]}"; do
        if [ "$license" == "$allowed" ]; then
            return 0
        fi
    done
    return 1
}

# Function to check if package should warn
is_warn() {
    local license="$1"
    for warn in "${WARN_LICENSES[@]}"; do
        if [ "$license" == "$warn" ]; then
            return 0
        fi
    done
    return 1
}

# Function to check if package is blocked
is_blocked() {
    local license="$1"
    for blocked in "${BLOCKED_LICENSES[@]}"; do
        if [[ "$license" =~ $blocked ]]; then
            return 0
        fi
    done
    return 1
}

# Function to run license-checker
run_license_check() {
    echo -e "${BLUE}Running license-checker...${NC}"
    echo ""

    cd "$PROJECT_ROOT"

    # Run license-checker and save to JSON (include all dependencies, not just production)
    npx license-checker \
        --json \
        --start "$PROJECT_ROOT" \
        --out "$REPORT_FILE" \
        --excludePrivatePackages \
        2>/dev/null || true

    if [ ! -f "$REPORT_FILE" ]; then
        echo -e "${RED}Error: Failed to generate license report${NC}"
        exit 1
    fi

    # Check if report has actual packages (more than just the root package)
    local package_count=$(node -p "Object.keys(JSON.parse(require('fs').readFileSync('$REPORT_FILE', 'utf8'))).length" 2>/dev/null || echo "0")

    if [ "$package_count" -eq 0 ] || [ "$package_count" -eq 1 ]; then
        echo -e "${YELLOW}Warning: No dependencies found to check${NC}"
        echo -e "${YELLOW}This might be normal for a monorepo root. Checking workspaces...${NC}"

        # Try to check node_modules directly
        if [ -d "$PROJECT_ROOT/node_modules" ]; then
            npx license-checker \
                --json \
                --start "$PROJECT_ROOT" \
                --out "$REPORT_FILE" \
                2>/dev/null || true
        fi
    fi

    echo -e "${GREEN}License data collected successfully${NC}"
    echo ""
}

# Function to analyze licenses
analyze_licenses() {
    echo -e "${BLUE}Analyzing licenses...${NC}"
    echo ""

    local total=0
    local allowed=0
    local warnings=0
    local blocked=0
    local unknown=0

    local blocked_packages=()
    local warn_packages=()
    local unknown_packages=()

    # Convert arrays to comma-separated strings
    local allowed_str=$(IFS=,; echo "${ALLOWED_LICENSES[*]}")
    local warn_str=$(IFS=,; echo "${WARN_LICENSES[*]}")
    local blocked_str=$(IFS=,; echo "${BLOCKED_LICENSES[*]}")

    # Run the node analysis script and capture output
    eval "$(node "${SCRIPT_DIR}/analyze-licenses.js" "$REPORT_FILE" "$allowed_str" "$warn_str" "$blocked_str")"

    # Parse the arrays from node output
    if [ -n "$blocked_packages_data" ]; then
        IFS='|||' read -ra blocked_packages <<< "$blocked_packages_data"
    fi

    if [ -n "$warn_packages_data" ]; then
        IFS='|||' read -ra warn_packages <<< "$warn_packages_data"
    fi

    if [ -n "$unknown_packages_data" ]; then
        IFS='|||' read -ra unknown_packages <<< "$unknown_packages_data"
    fi

    # Generate summary
    echo -e "${BLUE}License Summary:${NC}"
    echo -e "  Total packages scanned: ${total}"
    echo -e "  ${GREEN}Allowed licenses: ${allowed}${NC}"
    echo -e "  ${YELLOW}Warning licenses: ${warnings}${NC}"
    echo -e "  ${RED}Blocked licenses: ${blocked}${NC}"
    echo -e "  Unknown/unidentified: ${unknown}"
    echo ""

    # Report blocked packages
    if [ ${#blocked_packages[@]} -gt 0 ]; then
        echo -e "${RED}BLOCKED PACKAGES (FAIL):${NC}"
        for pkg in "${blocked_packages[@]}"; do
            echo -e "  ${RED}✗${NC} $pkg"
        done
        echo ""
    fi

    # Report warning packages
    if [ ${#warn_packages[@]} -gt 0 ]; then
        echo -e "${YELLOW}WARNING PACKAGES (Review needed):${NC}"
        for pkg in "${warn_packages[@]}"; do
            echo -e "  ${YELLOW}⚠${NC} $pkg"
        done
        echo ""
    fi

    # Report unknown packages
    if [ ${#unknown_packages[@]} -gt 0 ]; then
        echo -e "${YELLOW}UNKNOWN LICENSES (Review needed):${NC}"
        for pkg in "${unknown_packages[@]}"; do
            echo -e "  ${YELLOW}?${NC} $pkg"
        done
        echo ""
    fi

    # Generate markdown report
    generate_markdown_report "$total" "$allowed" "$warnings" "$blocked" "$unknown" \
        "${blocked_packages[*]}" "${warn_packages[*]}" "${unknown_packages[*]}"

    # Return status
    if [ $blocked -gt 0 ]; then
        return 1
    fi

    return 0
}

# Function to generate markdown report
generate_markdown_report() {
    local total=$1
    local allowed=$2
    local warnings=$3
    local blocked=$4
    local unknown=$5
    local blocked_pkgs="$6"
    local warn_pkgs="$7"
    local unknown_pkgs="$8"

    cat > "$REPORT_MD" << EOF
# License Compliance Report

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Summary

| Category | Count |
|----------|-------|
| Total Packages | $total |
| Allowed Licenses | $allowed |
| Warning Licenses | $warnings |
| Blocked Licenses | $blocked |
| Unknown Licenses | $unknown |

## Status

EOF

    if [ $blocked -gt 0 ]; then
        echo "**Status:** ❌ FAILED - Blocked licenses detected" >> "$REPORT_MD"
    elif [ $warnings -gt 0 ] || [ $unknown -gt 0 ]; then
        echo "**Status:** ⚠️ WARNING - Review needed" >> "$REPORT_MD"
    else
        echo "**Status:** ✅ PASSED - All licenses compliant" >> "$REPORT_MD"
    fi

    cat >> "$REPORT_MD" << EOF

## Policy

### Allowed Licenses
$(for license in "${ALLOWED_LICENSES[@]}"; do echo "- $license"; done)

### Warning Licenses (Review Required)
$(for license in "${WARN_LICENSES[@]}"; do echo "- $license"; done)

### Blocked Licenses (Not Permitted)
$(for license in "${BLOCKED_LICENSES[@]}"; do echo "- $license"; done)

EOF

    if [ -n "$blocked_pkgs" ]; then
        cat >> "$REPORT_MD" << EOF
## Blocked Packages

These packages MUST be removed or replaced:

EOF
        echo "$blocked_pkgs" | tr ' ' '\n' | while read -r pkg; do
            echo "- ❌ $pkg" >> "$REPORT_MD"
        done
        echo "" >> "$REPORT_MD"
    fi

    if [ -n "$warn_pkgs" ]; then
        cat >> "$REPORT_MD" << EOF
## Warning Packages

These packages require legal review:

EOF
        echo "$warn_pkgs" | tr ' ' '\n' | while read -r pkg; do
            echo "- ⚠️ $pkg" >> "$REPORT_MD"
        done
        echo "" >> "$REPORT_MD"
    fi

    if [ -n "$unknown_pkgs" ]; then
        cat >> "$REPORT_MD" << EOF
## Unknown Licenses

These packages have unidentified licenses:

EOF
        echo "$unknown_pkgs" | tr ' ' '\n' | while read -r pkg; do
            echo "- ❓ $pkg" >> "$REPORT_MD"
        done
        echo "" >> "$REPORT_MD"
    fi

    cat >> "$REPORT_MD" << EOF

## Full Report

See \`license-report.json\` for detailed license information.

## What to Do

1. **Blocked licenses**: Remove these dependencies or find alternatives
2. **Warning licenses**: Get legal review before proceeding
3. **Unknown licenses**: Investigate the package repository for license information

For questions, see \`LICENSE_POLICY.md\`.
EOF

    echo -e "${GREEN}Markdown report generated: $REPORT_MD${NC}"
}

# Main execution
main() {
    load_config
    run_license_check

    if analyze_licenses; then
        echo -e "${GREEN}================================================${NC}"
        echo -e "${GREEN}   License compliance check PASSED ✓${NC}"
        echo -e "${GREEN}================================================${NC}"
        echo ""
        echo -e "Reports generated:"
        echo -e "  - JSON: ${REPORT_FILE}"
        echo -e "  - Markdown: ${REPORT_MD}"
        exit 0
    else
        echo -e "${RED}================================================${NC}"
        echo -e "${RED}   License compliance check FAILED ✗${NC}"
        echo -e "${RED}================================================${NC}"
        echo ""
        echo -e "${RED}Action required:${NC}"
        echo -e "  1. Review blocked packages above"
        echo -e "  2. Remove or replace blocked dependencies"
        echo -e "  3. See LICENSE_POLICY.md for guidance"
        echo -e "  4. Consult legal team if needed"
        echo ""
        echo -e "Reports generated:"
        echo -e "  - JSON: ${REPORT_FILE}"
        echo -e "  - Markdown: ${REPORT_MD}"
        exit 1
    fi
}

# Run main function
main
