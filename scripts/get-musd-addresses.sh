#!/bin/bash

# ==============================================================================
#                    Get MUSD Contract Addresses from Mezo
# ==============================================================================
# This script fetches official MUSD contract addresses from Mezo's deployment
# and updates the .env file with the correct addresses for Matsnet integration
#
# Usage:
#   ./scripts/get-musd-addresses.sh [network]
#   
# Networks:
#   matsnet    - Mezo's Sepolia testnet (default)
#   mainnet    - Ethereum mainnet (when available)
#
# Requirements:
#   - jq (for JSON parsing)
#   - curl (for HTTP requests)
#   - git (for cloning repos)
#
# ==============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/contracts/.env"
NETWORK="${1:-matsnet}"
TEMP_DIR="/tmp/khipuvault-musd-fetch"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              KhipuVault - MUSD Address Fetcher             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Network: ${NETWORK}${NC}"
echo -e "${YELLOW}Project Root: ${PROJECT_ROOT}${NC}"
echo ""

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required but not installed${NC}"
        echo "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ git is required but not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All dependencies available${NC}"
}

# Clone or update Mezo MUSD repository
fetch_musd_repo() {
    echo -e "${BLUE}📥 Fetching Mezo MUSD repository...${NC}"
    
    # Clean up any existing temp directory
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # Clone the official Mezo MUSD repository
    echo -e "${YELLOW}Cloning https://github.com/mezo-org/musd.git...${NC}"
    
    if git clone https://github.com/mezo-org/musd.git "$TEMP_DIR/musd" --quiet; then
        echo -e "${GREEN}✅ Repository cloned successfully${NC}"
    else
        echo -e "${RED}❌ Failed to clone MUSD repository${NC}"
        echo "Check your internet connection and try again"
        exit 1
    fi
}

# Get contract addresses from deployment files
get_contract_addresses() {
    echo -e "${BLUE}📋 Extracting contract addresses...${NC}"
    
    local deployment_dir="$TEMP_DIR/musd/solidity/deployments"
    
    # Check if deployments directory exists
    if [[ ! -d "$deployment_dir" ]]; then
        echo -e "${RED}❌ Deployments directory not found in MUSD repo${NC}"
        echo "The repository structure might have changed"
        exit 1
    fi
    
    # Look for network-specific deployment files
    case $NETWORK in
        "matsnet")
            local deployment_files=("$deployment_dir/matsnet.json" "$deployment_dir/sepolia.json" "$deployment_dir/11155111.json")
            ;;
        "mainnet")
            local deployment_files=("$deployment_dir/mainnet.json" "$deployment_dir/1.json")
            ;;
        *)
            echo -e "${RED}❌ Unsupported network: $NETWORK${NC}"
            echo "Supported networks: matsnet, mainnet"
            exit 1
            ;;
    esac
    
    # Find the correct deployment file
    local deployment_file=""
    for file in "${deployment_files[@]}"; do
        if [[ -f "$file" ]]; then
            deployment_file="$file"
            break
        fi
    done
    
    if [[ -z "$deployment_file" ]]; then
        echo -e "${YELLOW}⚠️  No deployment file found for $NETWORK${NC}"
        echo "Available deployments:"
        ls -la "$deployment_dir/" | grep -E "\.(json)$" || echo "None found"
        
        # Try to get from a configuration file or README
        echo -e "${YELLOW}🔍 Checking for addresses in documentation...${NC}"
        if [[ -f "$TEMP_DIR/musd/README.md" ]]; then
            echo "Checking README.md for contract addresses..."
            grep -i "address\|contract" "$TEMP_DIR/musd/README.md" | head -10
        fi
        
        # Provide manual instructions
        echo -e "${BLUE}📝 Manual Steps:${NC}"
        echo "1. Visit the Mezo Discord or documentation"
        echo "2. Get official contract addresses for $NETWORK"
        echo "3. Update your .env file manually"
        echo "4. Verify addresses on Etherscan"
        
        return 1
    fi
    
    echo -e "${GREEN}✅ Found deployment file: $(basename "$deployment_file")${NC}"
    
    # Parse contract addresses from JSON
    echo -e "${YELLOW}Extracting addresses from deployment file...${NC}"
    
    # Check if file is valid JSON
    if ! jq empty "$deployment_file" 2>/dev/null; then
        echo -e "${RED}❌ Invalid JSON in deployment file${NC}"
        return 1
    fi
    
    # Extract key addresses (adjust based on actual MUSD deployment structure)
    MUSD_ADDRESS=$(jq -r '.musd // .MUSD // .contracts.MUSD // .addresses.musd // empty' "$deployment_file" 2>/dev/null)
    BORROWER_OPS=$(jq -r '.borrowerOperations // .BorrowerOperations // .contracts.BorrowerOperations // .addresses.borrowerOperations // empty' "$deployment_file" 2>/dev/null)
    TROVE_MANAGER=$(jq -r '.troveManager // .TroveManager // .contracts.TroveManager // .addresses.troveManager // empty' "$deployment_file" 2>/dev/null)
    PRICE_FEED=$(jq -r '.priceFeed // .PriceFeed // .contracts.PriceFeed // .addresses.priceFeed // empty' "$deployment_file" 2>/dev/null)
    HINT_HELPERS=$(jq -r '.hintHelpers // .HintHelpers // .contracts.HintHelpers // .addresses.hintHelpers // empty' "$deployment_file" 2>/dev/null)
    ACTIVE_POOL=$(jq -r '.activePool // .ActivePool // .contracts.ActivePool // .addresses.activePool // empty' "$deployment_file" 2>/dev/null)
    STABILITY_POOL=$(jq -r '.stabilityPool // .StabilityPool // .contracts.StabilityPool // .addresses.stabilityPool // empty' "$deployment_file" 2>/dev/null)
    SORTED_TROVES=$(jq -r '.sortedTroves // .SortedTroves // .contracts.SortedTroves // .addresses.sortedTroves // empty' "$deployment_file" 2>/dev/null)
    
    # Display found addresses
    echo -e "${GREEN}📝 Contract Addresses Found:${NC}"
    echo -e "${YELLOW}MUSD Token:${NC} ${MUSD_ADDRESS:-'Not found'}"
    echo -e "${YELLOW}BorrowerOperations:${NC} ${BORROWER_OPS:-'Not found'}"
    echo -e "${YELLOW}TroveManager:${NC} ${TROVE_MANAGER:-'Not found'}"
    echo -e "${YELLOW}PriceFeed:${NC} ${PRICE_FEED:-'Not found'}"
    echo -e "${YELLOW}HintHelpers:${NC} ${HINT_HELPERS:-'Not found'}"
    echo -e "${YELLOW}ActivePool:${NC} ${ACTIVE_POOL:-'Not found'}"
    echo -e "${YELLOW}StabilityPool:${NC} ${STABILITY_POOL:-'Not found'}"
    echo -e "${YELLOW}SortedTroves:${NC} ${SORTED_TROVES:-'Not found'}"
    
    # Validate required addresses
    local required_addresses=("$MUSD_ADDRESS" "$BORROWER_OPS" "$TROVE_MANAGER" "$PRICE_FEED" "$HINT_HELPERS")
    local missing_count=0
    
    for addr in "${required_addresses[@]}"; do
        if [[ -z "$addr" || "$addr" == "null" || "$addr" == "empty" ]]; then
            ((missing_count++))
        fi
    done
    
    if [[ $missing_count -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  Some required addresses are missing${NC}"
        echo -e "${BLUE}📄 Raw deployment file content:${NC}"
        cat "$deployment_file" | jq .
        return 1
    fi
    
    echo -e "${GREEN}✅ All required addresses found${NC}"
}

# Update .env file with addresses
update_env_file() {
    echo -e "${BLUE}📝 Updating .env file...${NC}"
    
    # Backup existing .env if it exists
    if [[ -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✅ Backed up existing .env file${NC}"
    else
        echo -e "${YELLOW}⚠️  No existing .env file found, creating new one${NC}"
        # Copy from template
        if [[ -f "$PROJECT_ROOT/contracts/.env.matsnet.example" ]]; then
            cp "$PROJECT_ROOT/contracts/.env.matsnet.example" "$ENV_FILE"
        fi
    fi
    
    # Update or add addresses to .env file
    update_env_var() {
        local var_name="$1"
        local var_value="$2"
        
        if [[ -n "$var_value" && "$var_value" != "null" ]]; then
            if grep -q "^${var_name}=" "$ENV_FILE" 2>/dev/null; then
                # Update existing variable
                sed -i.tmp "s|^${var_name}=.*|${var_name}=${var_value}|" "$ENV_FILE"
                rm -f "$ENV_FILE.tmp"
            else
                # Add new variable
                echo "${var_name}=${var_value}" >> "$ENV_FILE"
            fi
            echo -e "${GREEN}  ✅ Updated ${var_name}${NC}"
        fi
    }
    
    # Map network to env variable prefix
    local prefix=""
    case $NETWORK in
        "matsnet")
            prefix="MATSNET_"
            ;;
        "mainnet")
            prefix="MAINNET_"
            ;;
    esac
    
    # Update all addresses
    update_env_var "${prefix}MUSD_ADDRESS" "$MUSD_ADDRESS"
    update_env_var "${prefix}BORROWER_OPERATIONS" "$BORROWER_OPS"
    update_env_var "${prefix}TROVE_MANAGER" "$TROVE_MANAGER"
    update_env_var "${prefix}PRICE_FEED" "$PRICE_FEED"
    update_env_var "${prefix}HINT_HELPERS" "$HINT_HELPERS"
    update_env_var "${prefix}ACTIVE_POOL" "$ACTIVE_POOL"
    update_env_var "${prefix}STABILITY_POOL" "$STABILITY_POOL"
    update_env_var "${prefix}SORTED_TROVES" "$SORTED_TROVES"
    
    # Also update generic addresses for compatibility
    if [[ "$NETWORK" == "matsnet" ]]; then
        update_env_var "MUSD_ADDRESS" "$MUSD_ADDRESS"
    fi
    
    echo -e "${GREEN}✅ Environment file updated${NC}"
}

# Verify addresses on Etherscan
verify_addresses() {
    echo -e "${BLUE}🔍 Verifying addresses on Etherscan...${NC}"
    
    local etherscan_url=""
    case $NETWORK in
        "matsnet")
            etherscan_url="https://sepolia.etherscan.io/address"
            ;;
        "mainnet")
            etherscan_url="https://etherscan.io/address"
            ;;
    esac
    
    # Function to check if address is a contract
    check_address() {
        local addr="$1"
        local name="$2"
        
        if [[ -n "$addr" && "$addr" != "null" ]]; then
            echo -e "${YELLOW}  Checking ${name}...${NC}"
            echo -e "    Address: ${addr}"
            echo -e "    Etherscan: ${etherscan_url}/${addr}"
            
            # Basic validation - check if it looks like an address
            if [[ ${#addr} -eq 42 && "$addr" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
                echo -e "${GREEN}    ✅ Valid format${NC}"
            else
                echo -e "${RED}    ❌ Invalid address format${NC}"
            fi
        fi
    }
    
    check_address "$MUSD_ADDRESS" "MUSD Token"
    check_address "$BORROWER_OPS" "BorrowerOperations"
    check_address "$TROVE_MANAGER" "TroveManager"
    check_address "$PRICE_FEED" "PriceFeed"
    check_address "$HINT_HELPERS" "HintHelpers"
}

# Print next steps
print_next_steps() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                       Next Steps                           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}1. Verify Contract Addresses:${NC}"
    echo "   Check each address on Etherscan to ensure they're valid contracts"
    echo ""
    echo -e "${GREEN}2. Test Integration:${NC}"
    echo "   make test-matsnet-integration"
    echo ""
    echo -e "${GREEN}3. Deploy KhipuVault:${NC}"
    echo "   make deploy-matsnet-all"
    echo ""
    echo -e "${GREEN}4. Manual Verification (if needed):${NC}"
    echo "   - Join Mezo Discord/Telegram for official addresses"
    echo "   - Check Mezo documentation"
    echo "   - Verify with Mezo team before mainnet use"
    echo ""
    echo -e "${YELLOW}📝 Environment file location: ${ENV_FILE}${NC}"
    echo -e "${YELLOW}🔍 Backup created with timestamp${NC}"
}

# Cleanup function
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up...${NC}"
    rm -rf "$TEMP_DIR"
}

# Main execution
main() {
    echo -e "${BLUE}Starting MUSD address fetch for ${NETWORK}...${NC}"
    echo ""
    
    # Setup cleanup on exit
    trap cleanup EXIT
    
    # Run all steps
    check_dependencies
    fetch_musd_repo
    
    if get_contract_addresses; then
        update_env_file
        verify_addresses
        print_next_steps
        echo -e "${GREEN}🎉 Successfully updated MUSD addresses for ${NETWORK}!${NC}"
    else
        echo -e "${RED}❌ Failed to get complete contract addresses${NC}"
        echo -e "${YELLOW}📋 Manual configuration required${NC}"
        echo ""
        echo "Please get official addresses from:"
        echo "  - Mezo Discord: https://discord.gg/mezo"
        echo "  - Mezo Documentation"
        echo "  - GitHub: https://github.com/mezo-org/musd"
        exit 1
    fi
}

# Run main function
main "$@"