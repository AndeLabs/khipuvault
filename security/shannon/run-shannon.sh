#!/bin/bash
# Shannon AI Pentester - KhipuVault Security Testing
# https://github.com/KeygraphHQ/shannon

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Shannon AI Pentester - KhipuVault Security        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "\n${YELLOW}[1/4] Checking prerequisites...${NC}"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker is not installed${NC}"
        echo "  Install: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker installed${NC}"

    # Check API key
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        echo -e "${RED}✗ ANTHROPIC_API_KEY not set${NC}"
        echo "  Export your API key: export ANTHROPIC_API_KEY='your-key'"
        exit 1
    fi
    echo -e "${GREEN}✓ Anthropic API key configured${NC}"

    # Check if services are running
    if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ API server not running on :3001${NC}"
        echo "  Start with: pnpm dev:api"
    else
        echo -e "${GREEN}✓ API server running${NC}"
    fi

    if ! curl -s http://localhost:9002 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Web server not running on :9002${NC}"
        echo "  Start with: pnpm dev:web"
    else
        echo -e "${GREEN}✓ Web server running${NC}"
    fi
}

# Build Shannon Docker image
build_shannon() {
    echo -e "\n${YELLOW}[2/4] Building Shannon Docker image...${NC}"

    if docker images | grep -q "shannon"; then
        echo -e "${GREEN}✓ Shannon image already exists${NC}"
        read -p "  Rebuild? (y/N): " rebuild
        if [ "$rebuild" != "y" ]; then
            return
        fi
    fi

    # Clone if not exists
    if [ ! -d "./shannon-repo" ]; then
        echo "  Cloning Shannon repository..."
        git clone https://github.com/KeygraphHQ/shannon.git shannon-repo
    fi

    cd shannon-repo
    docker build -t shannon:latest .
    cd ..

    echo -e "${GREEN}✓ Shannon image built${NC}"
}

# Prepare repository for scanning
prepare_repo() {
    echo -e "\n${YELLOW}[3/4] Preparing KhipuVault repository...${NC}"

    REPO_DIR="./repos/khipuvault"

    # Create repos directory
    mkdir -p ./repos

    # Copy or link the repository
    if [ ! -d "$REPO_DIR" ]; then
        echo "  Linking KhipuVault source code..."
        ln -sf "$(pwd)/../.." "$REPO_DIR"
    fi

    echo -e "${GREEN}✓ Repository prepared at $REPO_DIR${NC}"
}

# Run Shannon scan
run_scan() {
    echo -e "\n${YELLOW}[4/4] Running Shannon security scan...${NC}"

    TARGET=${1:-"http://host.docker.internal:3001"}

    echo -e "  Target: ${BLUE}$TARGET${NC}"
    echo -e "  Config: ${BLUE}./config.yaml${NC}"
    echo ""

    # Create deliverables directory
    mkdir -p ./deliverables

    # Run Shannon
    docker run --rm -it \
        --network host \
        --cap-add=NET_RAW \
        --cap-add=NET_ADMIN \
        -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
        -e CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000 \
        -v "$(pwd)/repos:/app/repos" \
        -v "$(pwd)/config.yaml:/app/config.yaml" \
        -v "$(pwd)/deliverables:/app/deliverables" \
        shannon:latest \
        "$TARGET" \
        "/app/repos/khipuvault" \
        --config /app/config.yaml

    echo -e "\n${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Scan complete! Reports saved to ./deliverables/${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
}

# Quick scan - API only
quick_scan() {
    echo -e "\n${BLUE}Running quick API scan...${NC}"
    run_scan "http://host.docker.internal:3001"
}

# Full scan - Web + API
full_scan() {
    echo -e "\n${BLUE}Running full scan (Web + API)...${NC}"

    # Scan API
    echo -e "\n${YELLOW}Phase 1: API Security${NC}"
    run_scan "http://host.docker.internal:3001"

    # Scan Web
    echo -e "\n${YELLOW}Phase 2: Web Security${NC}"
    run_scan "http://host.docker.internal:9002"
}

# Show help
show_help() {
    echo -e "\n${BLUE}Usage:${NC}"
    echo "  ./run-shannon.sh [command]"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  setup     - Check prerequisites and build Shannon"
    echo "  quick     - Quick scan (API only)"
    echo "  full      - Full scan (Web + API)"
    echo "  api       - Scan API server only"
    echo "  web       - Scan Web server only"
    echo "  help      - Show this help"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  ./run-shannon.sh setup"
    echo "  ./run-shannon.sh quick"
    echo "  ./run-shannon.sh full"
    echo ""
    echo -e "${BLUE}Environment:${NC}"
    echo "  ANTHROPIC_API_KEY - Required for Shannon to work"
    echo ""
}

# Main
case "${1:-help}" in
    setup)
        check_prerequisites
        build_shannon
        prepare_repo
        echo -e "\n${GREEN}Setup complete! Run './run-shannon.sh quick' to start scanning.${NC}"
        ;;
    quick)
        check_prerequisites
        prepare_repo
        quick_scan
        ;;
    full)
        check_prerequisites
        prepare_repo
        full_scan
        ;;
    api)
        check_prerequisites
        prepare_repo
        run_scan "http://host.docker.internal:3001"
        ;;
    web)
        check_prerequisites
        prepare_repo
        run_scan "http://host.docker.internal:9002"
        ;;
    help|*)
        show_help
        ;;
esac
