# ==================================================================
# KhipuVault - Deployment & Testing Makefile
# ==================================================================

-include .env
export

.PHONY: help install build test clean deploy-all

# Default target
help:
	@echo "KhipuVault - Available Commands"
	@echo "================================"
	@echo ""
	@echo "Setup & Build:"
	@echo "  make install          - Install dependencies"
	@echo "  make build            - Compile contracts"
	@echo "  make clean            - Clean build artifacts"
	@echo ""
	@echo "Testing:"
	@echo "  make test             - Run all tests"
	@echo "  make test-unit        - Run unit tests only"
	@echo "  make test-gas         - Run tests with gas report"
	@echo "  make coverage         - Generate coverage report"
	@echo "  make snapshot         - Create gas snapshot"
	@echo ""
	@echo "Security:"
	@echo "  make audit            - Run all security audits"
	@echo "  make audit-slither    - Run Slither static analysis"
	@echo "  make audit-aderyn     - Run Aderyn security scanner"
	@echo ""
	@echo "Local Development:"
	@echo "  make anvil            - Start local Anvil node"
	@echo "  make deploy-local     - Deploy all contracts to Anvil"
	@echo ""
	@echo "Testnet Deployment (Sepolia):"
	@echo "  make deploy-sepolia-tokens       - Deploy mock tokens"
	@echo "  make deploy-sepolia-integrations - Deploy Mezo & Yield integrations"
	@echo "  make deploy-sepolia-pools        - Deploy all pools"
	@echo "  make deploy-sepolia-all          - Deploy everything (tokens + integrations + pools)"
	@echo ""
	@echo "Mezo Testnet Deployment (Chain ID: 31611):"
	@echo "  make deploy-mezo-integrations - Deploy integrations (uses real Mezo)"
	@echo "  make deploy-mezo-pools        - Deploy pools"
	@echo "  make deploy-mezo-all          - Deploy everything on Mezo Testnet"
	@echo ""
	@echo "Legacy Matsnet Commands (deprecated, use deploy-mezo-* instead):"
	@echo "  make deploy-matsnet-integrations - Deploy integrations"
	@echo "  make deploy-matsnet-pools        - Deploy pools"
	@echo "  make deploy-matsnet-all          - Deploy everything"
	@echo ""
	@echo "Verification:"
	@echo "  make verify-sepolia   - Verify all contracts on Sepolia"
	@echo ""

# ==================================================================
# SETUP & BUILD
# ==================================================================

install:
	forge install

build:
	forge build

clean:
	forge clean
	rm -rf cache out

# ==================================================================
# TESTING
# ==================================================================

test:
	forge test -vv

test-unit:
	forge test --match-path "test/unit/**/*.sol" -vv

test-integration:
	forge test --match-path "test/integration/**/*.sol" -vv

test-gas:
	REPORT_GAS=true forge test -vv

coverage:
	forge coverage --report lcov
	@echo "Coverage report generated: lcov.info"
	@echo "View with: genhtml lcov.info -o coverage"

snapshot:
	forge snapshot

# ==================================================================
# SECURITY AUDITS
# ==================================================================

audit: audit-slither audit-aderyn
	@echo "✅ All security audits completed!"

audit-slither:
	@echo "Running Slither static analysis..."
	@if command -v slither >/dev/null 2>&1; then \
		slither . --filter-paths "test/|script/|lib/" --exclude-dependencies; \
	else \
		echo "❌ Slither not installed. Install: pip3 install slither-analyzer"; \
		exit 1; \
	fi

audit-aderyn:
	@echo "Running Aderyn security scanner..."
	@if command -v aderyn >/dev/null 2>&1; then \
		aderyn .; \
	else \
		echo "❌ Aderyn not installed. Install: cargo install aderyn"; \
		echo "Or download from: https://github.com/Cyfrin/aderyn"; \
		exit 1; \
	fi

# ==================================================================
# LOCAL DEVELOPMENT (ANVIL)
# ==================================================================

anvil:
	anvil --chain-id 31337 --block-time 2

deploy-local-tokens:
	forge script script/01_DeployTokens.s.sol:DeployTokens \
		--rpc-url http://127.0.0.1:8545 \
		--broadcast \
		-vvvv

deploy-local-integrations:
	forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
		--rpc-url http://127.0.0.1:8545 \
		--broadcast \
		-vvvv

deploy-local-pools:
	forge script script/03_DeployPools.s.sol:DeployPools \
		--rpc-url http://127.0.0.1:8545 \
		--broadcast \
		-vvvv

deploy-local: deploy-local-tokens deploy-local-integrations deploy-local-pools
	@echo "✅ All contracts deployed to Anvil!"

# ==================================================================
# SEPOLIA TESTNET DEPLOYMENT
# ==================================================================

deploy-sepolia-tokens:
	@echo "Deploying mock tokens to Sepolia..."
	forge script script/01_DeployTokens.s.sol:DeployTokens \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--broadcast \
		--verify \
		-vvvv
	@echo "✅ Tokens deployed! Update .env with addresses"

deploy-sepolia-integrations:
	@echo "Deploying integrations to Sepolia..."
	forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--broadcast \
		--verify \
		-vvvv
	@echo "✅ Integrations deployed!"

deploy-sepolia-pools:
	@echo "Deploying pools to Sepolia..."
	forge script script/03_DeployPools.s.sol:DeployPools \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--broadcast \
		--verify \
		-vvvv
	@echo "✅ All pools deployed!"

deploy-sepolia-all: deploy-sepolia-tokens deploy-sepolia-integrations deploy-sepolia-pools
	@echo "✅✅✅ COMPLETE DEPLOYMENT TO SEPOLIA SUCCESSFUL! ✅✅✅"
	@echo ""
	@echo "Next steps:"
	@echo "1. Check deployment files in ./deployments/"
	@echo "2. Update .env with deployed addresses"
	@echo "3. Create VRF subscription at vrf.chain.link"
	@echo "4. Add LotteryPool as VRF consumer"
	@echo "5. Fund contracts with test tokens"

# ==================================================================
# MEZO TESTNET DEPLOYMENT (Chain ID: 31611)
# ==================================================================

deploy-mezo-integrations:
	@echo "=========================================="
	@echo "🚀 Deploying to Mezo Testnet (Chain ID: 31611)"
	@echo "=========================================="
	@echo "⚠️  Prerequisites:"
	@echo "  - DEPLOYER_PRIVATE_KEY set in .env"
	@echo "  - FEE_COLLECTOR_ADDRESS set in .env"
	@echo "  - Wallet has testnet BTC for gas"
	@echo "=========================================="
	@test -n "$(DEPLOYER_PRIVATE_KEY)" || (echo "❌ DEPLOYER_PRIVATE_KEY not set" && exit 1)
	@test -n "$(FEE_COLLECTOR_ADDRESS)" || (echo "❌ FEE_COLLECTOR_ADDRESS not set" && exit 1)
	forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
		--rpc-url https://rpc.test.mezo.org \
		--broadcast \
		--slow \
		-vvvv
	@echo "✅ Mezo integrations deployed!"
	@echo "📝 Check deployments/ directory for addresses"

deploy-mezo-pools:
	@echo "=========================================="
	@echo "🚀 Deploying Pools to Mezo Testnet"
	@echo "=========================================="
	@test -n "$(DEPLOYER_PRIVATE_KEY)" || (echo "❌ DEPLOYER_PRIVATE_KEY not set" && exit 1)
	forge script script/03_DeployPools.s.sol:DeployPools \
		--rpc-url https://rpc.test.mezo.org \
		--broadcast \
		--slow \
		-vvvv
	@echo "✅ All pools deployed to Mezo Testnet!"
	@echo "📝 Check deployments/ directory for addresses"

deploy-mezo-all: deploy-mezo-integrations deploy-mezo-pools
	@echo "=========================================="
	@echo "✅✅✅ MEZO TESTNET DEPLOYMENT COMPLETE! ✅✅✅"
	@echo "=========================================="
	@echo "📊 Next Steps:"
	@echo "  1. Copy contract addresses from deployments/"
	@echo "  2. Update frontend .env.local with addresses"
	@echo "  3. Copy ABIs to frontend: make copy-abis-frontend"
	@echo "  4. Test on Mezo Testnet"
	@echo "=========================================="

# Legacy Matsnet commands (deprecated)
deploy-matsnet-integrations: deploy-mezo-integrations
	@echo "⚠️  Note: deploy-matsnet-integrations is deprecated, use deploy-mezo-integrations"

deploy-matsnet-pools: deploy-mezo-pools
	@echo "⚠️  Note: deploy-matsnet-pools is deprecated, use deploy-mezo-pools"

deploy-matsnet-all: deploy-mezo-all
	@echo "⚠️  Note: deploy-matsnet-all is deprecated, use deploy-mezo-all"

# ==================================================================
# CONTRACT VERIFICATION
# ==================================================================

verify-sepolia:
	@echo "Verifying contracts on Sepolia Etherscan..."
	@echo "⚠️  Make sure contracts are deployed and addresses are in .env"
	@echo "Run verify commands manually with:"
	@echo "forge verify-contract <ADDRESS> <CONTRACT> --chain sepolia"

# ==================================================================
# UTILITIES
# ==================================================================

format:
	forge fmt

lint:
	forge fmt --check

sizes:
	forge build --sizes

flatten:
	@echo "Flattening contracts for manual verification..."
	mkdir -p flattened
	forge flatten src/pools/IndividualPool.sol > flattened/IndividualPool.sol
	forge flatten src/pools/CooperativePool.sol > flattened/CooperativePool.sol
	forge flatten src/pools/LotteryPool.sol > flattened/LotteryPool.sol
	forge flatten src/pools/RotatingPool.sol > flattened/RotatingPool.sol
	@echo "✅ Flattened contracts saved to ./flattened/"

create-deployments-dir:
	@mkdir -p deployments
	@echo "✅ Created deployments directory"

copy-abis-frontend:
	@echo "📦 Copying ABIs to frontend..."
	@mkdir -p ../frontend/src/contracts/abis
	@cp out/IndividualPool.sol/IndividualPool.json ../frontend/src/contracts/abis/ 2>/dev/null || true
	@cp out/CooperativePool.sol/CooperativePool.json ../frontend/src/contracts/abis/ 2>/dev/null || true
	@cp out/LotteryPool.sol/LotteryPool.json ../frontend/src/contracts/abis/ 2>/dev/null || true
	@cp out/RotatingPool.sol/RotatingPool.json ../frontend/src/contracts/abis/ 2>/dev/null || true
	@cp out/MezoIntegration.sol/MezoIntegration.json ../frontend/src/contracts/abis/ 2>/dev/null || true
	@cp out/YieldAggregator.sol/YieldAggregator.json ../frontend/src/contracts/abis/ 2>/dev/null || true
	@echo "✅ ABIs copied to frontend/src/contracts/abis/"
	@ls -lh ../frontend/src/contracts/abis/ 2>/dev/null || echo "Directory created"

# ==================================================================
# GAS OPTIMIZATION
# ==================================================================

gas-report:
	@echo "Generating detailed gas report..."
	REPORT_GAS=true forge test --gas-report > gas-report.txt
	@echo "✅ Gas report saved to gas-report.txt"

gas-compare:
	@echo "Creating gas snapshot for comparison..."
	forge snapshot --diff .gas-snapshot
	@echo "✅ Compare with previous snapshot"

# ==================================================================
# PRE-DEPLOYMENT CHECKS
# ==================================================================

check-env:
	@echo "Checking environment configuration..."
	@test -f .env || (echo "❌ .env file not found! Copy .env.example" && exit 1)
	@test -n "$(DEPLOYER_PRIVATE_KEY)" || (echo "❌ DEPLOYER_PRIVATE_KEY not set" && exit 1)
	@echo "✅ Environment configured"

preflight: check-env build test
	@echo "✅ Pre-flight checks passed!"
	@echo "Ready for deployment 🚀"

# ==================================================================
# COMPLETE WORKFLOW
# ==================================================================

setup: install build
	@echo "✅ Project setup complete!"

full-test: clean build test coverage
	@echo "✅ Full test suite complete!"

prepare-deploy: preflight audit create-deployments-dir
	@echo "✅ Ready for production deployment!"
	@echo ""
	@echo "To deploy to Sepolia:"
	@echo "  make deploy-sepolia-all"
	@echo ""
	@echo "To deploy to Mezo Testnet:"
	@echo "  make deploy-mezo-all"
