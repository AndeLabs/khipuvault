# KhipuVault Makefile
# Production-grade deployment and management commands

.PHONY: help install build test clean deploy-tokens deploy-integrations deploy-pools deploy-all verify-all test-integration

# Default target
.DEFAULT_GOAL := help

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

##@ Help

help: ## Display this help message
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║         KhipuVault - Production Deployment                 ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make $(BLUE)<target>$(NC)\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup

install: ## Install all dependencies
	@echo "$(BLUE)Installing Foundry dependencies...$(NC)"
	cd contracts && forge install
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(BLUE)Installing service dependencies...$(NC)"
	cd services && npm install
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

setup-env: ## Setup environment variables from template
	@if [ ! -f contracts/.env ]; then \
		echo "$(YELLOW)Creating .env from template...$(NC)"; \
		cp contracts/.env.example contracts/.env; \
		echo "$(GREEN)✓ .env file created$(NC)"; \
		echo "$(RED)⚠ IMPORTANT: Edit contracts/.env with your values!$(NC)"; \
	else \
		echo "$(YELLOW).env file already exists$(NC)"; \
	fi

##@ Build & Test

build: ## Compile all smart contracts
	@echo "$(BLUE)Compiling smart contracts...$(NC)"
	cd contracts && forge build
	@echo "$(GREEN)✓ Build successful$(NC)"

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	cd contracts && forge test -vv
	@echo "$(GREEN)✓ Tests complete$(NC)"

test-verbose: ## Run tests with verbose output
	@echo "$(BLUE)Running tests (verbose)...$(NC)"
	cd contracts && forge test -vvvv

test-gas: ## Run tests with gas reporting
	@echo "$(BLUE)Running tests with gas reporting...$(NC)"
	cd contracts && forge test --gas-report

coverage: ## Generate test coverage report
	@echo "$(BLUE)Generating coverage report...$(NC)"
	cd contracts && forge coverage
	@echo "$(GREEN)✓ Coverage report generated$(NC)"

##@ Security

security: ## Run security analysis (Slither + tests)
	@echo "$(BLUE)Running security analysis...$(NC)"
	@echo "$(YELLOW)1. Running tests...$(NC)"
	cd contracts && forge test
	@echo "$(YELLOW)2. Running Slither...$(NC)"
	cd contracts && slither . --config-file ../slither.config.json || true
	@echo "$(GREEN)✓ Security analysis complete$(NC)"

audit-prep: ## Prepare for security audit
	@echo "$(BLUE)Preparing audit package...$(NC)"
	mkdir -p audit-package
	cd contracts && forge build
	cp -r contracts/src audit-package/
	cp -r contracts/test audit-package/
	cd contracts && forge coverage --report lcov
	cp -r contracts/coverage audit-package/
	@echo "$(GREEN)✓ Audit package ready in ./audit-package$(NC)"

##@ Local Development

anvil: ## Start local Anvil node
	@echo "$(BLUE)Starting Anvil local node...$(NC)"
	anvil --block-time 2

deploy-local: build ## Deploy to local Anvil
	@echo "$(BLUE)Deploying to local network...$(NC)"
	@$(MAKE) --no-print-directory _deploy NETWORK=localhost RPC_URL=http://localhost:8545

##@ Matsnet Deployment (Mezo MUSD Testnet)

check-matsnet-env: ## Check Matsnet environment variables are set
	@if [ ! -f contracts/.env ]; then \
		echo "$(RED)✗ Error: .env file not found$(NC)"; \
		echo "Run: make setup-env"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Environment file exists$(NC)"
	@. contracts/.env && \
	if [ -z "$$DEPLOYER_PRIVATE_KEY" ] || [ "$$DEPLOYER_PRIVATE_KEY" = "0x0000000000000000000000000000000000000000000000000000000000000000" ]; then \
		echo "$(RED)✗ Error: DEPLOYER_PRIVATE_KEY not set in .env$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Private key configured$(NC)"
	@. contracts/.env && \
	if [ -z "$$MATSNET_BORROWER_OPERATIONS" ]; then \
		echo "$(RED)✗ Error: MATSNET_BORROWER_OPERATIONS not set in .env$(NC)"; \
		echo "Add Mezo MUSD contract addresses to .env"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Mezo MUSD contracts configured$(NC)"

deploy-matsnet-integrations: check-matsnet-env build ## Deploy integrations to Matsnet (Mezo testnet)
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Deploying REAL Mezo MUSD Integration to Matsnet$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo "$(YELLOW)Using Real MUSD Protocol Contracts$(NC)"
	cd contracts && forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
		--rpc-url $$MATSNET_RPC_URL \
		--broadcast \
		--verify \
		--etherscan-api-key $$ETHERSCAN_API_KEY \
		-vvvv
	@echo "$(GREEN)✓ Mezo Integration deployed to Matsnet$(NC)"

deploy-matsnet-pools: check-matsnet-env build ## Deploy pools to Matsnet testnet
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Deploying All Pools to Matsnet Testnet$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	cd contracts && forge script script/03_DeployPools.s.sol:DeployPools \
		--rpc-url $$MATSNET_RPC_URL \
		--broadcast \
		--verify \
		--etherscan-api-key $$ETHERSCAN_API_KEY \
		-vvvv
	@echo "$(GREEN)✓ Pools deployed to Matsnet$(NC)"

deploy-matsnet-all: ## Deploy complete KhipuVault system to Matsnet with REAL MUSD integration
	@echo "$(BLUE)╔═══════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║  COMPLETE DEPLOYMENT TO MATSNET (MEZO MUSD TESTNET)   ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)⚡ Using REAL Mezo MUSD Protocol Integration$(NC)"
	@echo "$(YELLOW)Step 1/2: Deploying Mezo Integration...$(NC)"
	@$(MAKE) --no-print-directory deploy-matsnet-integrations
	@echo ""
	@echo "$(YELLOW)Step 2/2: Deploying Savings Pools...$(NC)"
	@$(MAKE) --no-print-directory deploy-matsnet-pools
	@echo ""
	@echo "$(GREEN)╔═══════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║  ✅ COMPLETE SYSTEM DEPLOYED TO MATSNET               ║$(NC)"
	@echo "$(GREEN)║     WITH REAL MUSD PROTOCOL INTEGRATION               ║$(NC)"
	@echo "$(GREEN)╚═══════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)🚀 Next steps for Matsnet testing:$(NC)"
	@echo "  1. Get testnet BTC from faucet"
	@echo "  2. Test real MUSD minting: depositAndMint()"
	@echo "  3. Verify Trove creation in Mezo protocol"
	@echo "  4. Test yield generation and withdrawals"
	@echo "  5. Run comprehensive integration tests"
	@echo ""
	@echo "$(YELLOW)📊 Monitor deployment:$(NC)"
	@echo "  - Etherscan: https://sepolia.etherscan.io"
	@echo "  - Check deployments/ folder for addresses"

test-matsnet-integration: check-matsnet-env ## Run integration tests against Matsnet
	@echo "$(BLUE)Running Matsnet integration tests...$(NC)"
	cd contracts && forge test --fork-url $$MATSNET_RPC_URL --match-contract MatsnetIntegration -vvv
	@echo "$(GREEN)✓ Matsnet integration tests complete$(NC)"

##@ Testnet Deployment (Sepolia)

check-env: ## Check environment variables are set
	@if [ ! -f contracts/.env ]; then \
		echo "$(RED)✗ Error: .env file not found$(NC)"; \
		echo "Run: make setup-env"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Environment file exists$(NC)"
	@. contracts/.env && \
	if [ -z "$$DEPLOYER_PRIVATE_KEY" ] || [ "$$DEPLOYER_PRIVATE_KEY" = "0x0000000000000000000000000000000000000000000000000000000000000000" ]; then \
		echo "$(RED)✗ Error: DEPLOYER_PRIVATE_KEY not set in .env$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Private key configured$(NC)"

deploy-sepolia-tokens: check-env build ## Deploy tokens to Sepolia testnet
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Deploying Mock Tokens to Sepolia Testnet$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	cd contracts && forge script script/01_DeployTokens.s.sol:DeployTokens \
		--rpc-url $$SEPOLIA_RPC_URL \
		--broadcast \
		--verify \
		--etherscan-api-key $$ETHERSCAN_API_KEY \
		-vvvv
	@echo "$(GREEN)✓ Tokens deployed to Sepolia$(NC)"

deploy-sepolia-integrations: check-env build ## Deploy integrations to Sepolia testnet
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Deploying Core Integrations to Sepolia Testnet$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	cd contracts && forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
		--rpc-url $$SEPOLIA_RPC_URL \
		--broadcast \
		--verify \
		--etherscan-api-key $$ETHERSCAN_API_KEY \
		-vvvv
	@echo "$(GREEN)✓ Integrations deployed to Sepolia$(NC)"

deploy-sepolia-pools: check-env build ## Deploy pools to Sepolia testnet
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Deploying All Pools to Sepolia Testnet$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	cd contracts && forge script script/03_DeployPools.s.sol:DeployPools \
		--rpc-url $$SEPOLIA_RPC_URL \
		--broadcast \
		--verify \
		--etherscan-api-key $$ETHERSCAN_API_KEY \
		-vvvv
	@echo "$(GREEN)✓ Pools deployed to Sepolia$(NC)"

deploy-sepolia-all: ## Deploy complete system to Sepolia (tokens + integrations + pools)
	@echo "$(BLUE)╔═══════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║  COMPLETE DEPLOYMENT TO SEPOLIA TESTNET               ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Step 1/3: Deploying Tokens...$(NC)"
	@$(MAKE) --no-print-directory deploy-sepolia-tokens
	@echo ""
	@echo "$(YELLOW)Step 2/3: Deploying Integrations...$(NC)"
	@$(MAKE) --no-print-directory deploy-sepolia-integrations
	@echo ""
	@echo "$(YELLOW)Step 3/3: Deploying Pools...$(NC)"
	@$(MAKE) --no-print-directory deploy-sepolia-pools
	@echo ""
	@echo "$(GREEN)╔═══════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║  ✓ COMPLETE SYSTEM DEPLOYED TO SEPOLIA                ║$(NC)"
	@echo "$(GREEN)╚═══════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Check deployments/ folder for contract addresses"
	@echo "  2. Setup Chainlink VRF subscription"
	@echo "  3. Fund contracts with test tokens"
	@echo "  4. Run: make verify-deployments"

##@ Verification

verify-deployments: ## Verify all deployments are working
	@echo "$(BLUE)Verifying deployments...$(NC)"
	@if [ -f contracts/deployments/pools-11155111.json ]; then \
		echo "$(GREEN)✓ Found Sepolia deployment$(NC)"; \
		cat contracts/deployments/pools-11155111.json | jq .; \
	else \
		echo "$(RED)✗ No Sepolia deployment found$(NC)"; \
	fi

verify-contract: ## Verify single contract on Etherscan (usage: make verify-contract ADDRESS=0x... CONTRACT=Contract)
	@if [ -z "$(ADDRESS)" ] || [ -z "$(CONTRACT)" ]; then \
		echo "$(RED)✗ Usage: make verify-contract ADDRESS=0x... CONTRACT=ContractName$(NC)"; \
		exit 1; \
	fi
	cd contracts && forge verify-contract $(ADDRESS) $(CONTRACT) \
		--chain-id 11155111 \
		--etherscan-api-key $$ETHERSCAN_API_KEY

##@ Mainnet Deployment (DANGER!)

deploy-mainnet-warning: ## Show mainnet deployment warning
	@echo "$(RED)╔═══════════════════════════════════════════════════════╗$(NC)"
	@echo "$(RED)║              ⚠  MAINNET DEPLOYMENT ⚠                  ║$(NC)"
	@echo "$(RED)╚═══════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)This will deploy to MAINNET using REAL funds!$(NC)"
	@echo ""
	@echo "$(RED)Prerequisites:$(NC)"
	@echo "  [ ] Complete security audit by reputable firm"
	@echo "  [ ] All tests passing (100% coverage)"
	@echo "  [ ] Testnet deployment tested for 2+ weeks"
	@echo "  [ ] Emergency procedures documented"
	@echo "  [ ] Multisig wallet setup for owner"
	@echo "  [ ] Bug bounty program active"
	@echo "  [ ] Insurance coverage obtained"
	@echo "  [ ] Legal review completed"
	@echo ""
	@echo "$(YELLOW)Are you absolutely sure? Type 'DEPLOY_MAINNET' to continue:$(NC)"
	@read -r confirmation; \
	if [ "$$confirmation" != "DEPLOY_MAINNET" ]; then \
		echo "$(GREEN)✓ Deployment cancelled$(NC)"; \
		exit 1; \
	fi

deploy-mainnet: deploy-mainnet-warning check-env build test security ## Deploy to mainnet (USE WITH EXTREME CAUTION!)
	@echo "$(RED)Final confirmation required. Type contract name to deploy:$(NC)"
	@echo "  - tokens"
	@echo "  - integrations"
	@echo "  - pools"
	@read -r target; \
	if [ "$$target" = "tokens" ]; then \
		$(MAKE) --no-print-directory _deploy-mainnet-tokens; \
	elif [ "$$target" = "integrations" ]; then \
		$(MAKE) --no-print-directory _deploy-mainnet-integrations; \
	elif [ "$$target" = "pools" ]; then \
		$(MAKE) --no-print-directory _deploy-mainnet-pools; \
	else \
		echo "$(RED)✗ Invalid target$(NC)"; \
		exit 1; \
	fi

_deploy-mainnet-tokens:
	@echo "$(RED)Deploying tokens to MAINNET...$(NC)"
	cd contracts && forge script script/01_DeployTokens.s.sol:DeployTokens \
		--rpc-url $$MAINNET_RPC_URL \
		--broadcast \
		--verify \
		--etherscan-api-key $$ETHERSCAN_API_KEY \
		--slow \
		-vvvv

_deploy-mainnet-integrations:
	@echo "$(RED)Deploying integrations to MAINNET...$(NC)"
	cd contracts && forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
		--rpc-url $$MAINNET_RPC_URL \
		--broadcast \
		--verify \
		--etherscan-api-key $$ETHERSCAN_API_KEY \
		--slow \
		-vvvv

_deploy-mainnet-pools:
	@echo "$(RED)Deploying pools to MAINNET...$(NC)"
	cd contracts && forge script script/03_DeployPools.s.sol:DeployPools \
		--rpc-url $$MAINNET_RPC_URL \
		--broadcast \
		--verify \
		--etherscan-api-key $$ETHERSCAN_API_KEY \
		--slow \
		-vvvv

##@ MUSD Protocol Interaction

interact-musd: ## Interact with deployed MUSD integration (usage: make interact-musd AMOUNT=0.01)
	@if [ -z "$(AMOUNT)" ]; then \
		echo "$(RED)Usage: make interact-musd AMOUNT=0.01$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Interacting with MUSD integration...$(NC)"
	@. contracts/.env && \
	MEZO_ADDR=$$(jq -r '.mezoIntegration' contracts/deployments/integrations-11155111.json) && \
	echo "$(YELLOW)Depositing $(AMOUNT) WBTC and minting MUSD...$(NC)" && \
	cast send $$MEZO_ADDR "depositAndMint(uint256)" $$(echo "$(AMOUNT) * 10^8" | bc) \
		--rpc-url $$MATSNET_RPC_URL \
		--private-key $$DEPLOYER_PRIVATE_KEY
	@echo "$(GREEN)✓ MUSD interaction complete$(NC)"

check-musd-trove: ## Check user's Trove status in MUSD protocol
	@echo "$(BLUE)Checking Trove status...$(NC)"
	@. contracts/.env && \
	TROVE_MANAGER_ADDR=$$MATSNET_TROVE_MANAGER && \
	USER_ADDR=$$(cast wallet address $$DEPLOYER_PRIVATE_KEY) && \
	echo "$(YELLOW)User: $$USER_ADDR$(NC)" && \
	echo "$(YELLOW)Collateral and Debt:$(NC)" && \
	cast call $$TROVE_MANAGER_ADDR "getTroveDebtAndColl(address)" $$USER_ADDR \
		--rpc-url $$MATSNET_RPC_URL
	@echo "$(GREEN)✓ Trove status check complete$(NC)"

monitor-musd-system: ## Monitor MUSD system health
	@echo "$(BLUE)Monitoring MUSD system...$(NC)"
	@. contracts/.env && \
	TROVE_MANAGER_ADDR=$$MATSNET_TROVE_MANAGER && \
	PRICE_FEED_ADDR=$$MATSNET_PRICE_FEED && \
	echo "$(YELLOW)Current BTC Price:$(NC)" && \
	cast call $$PRICE_FEED_ADDR "fetchPrice()" --rpc-url $$MATSNET_RPC_URL && \
	echo "$(YELLOW)System Recovery Mode:$(NC)" && \
	PRICE=$$(cast call $$PRICE_FEED_ADDR "fetchPrice()" --rpc-url $$MATSNET_RPC_URL) && \
	cast call $$TROVE_MANAGER_ADDR "checkRecoveryMode(uint256)" $$PRICE --rpc-url $$MATSNET_RPC_URL
	@echo "$(GREEN)✓ System monitoring complete$(NC)"

##@ Utilities

clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	cd contracts && forge clean
	rm -rf contracts/cache
	rm -rf contracts/out
	rm -rf audit-package
	@echo "$(GREEN)✓ Clean complete$(NC)"

deployments: ## Show all deployments
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                    Deployment Summary                      ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@if [ -d contracts/deployments ]; then \
		for file in contracts/deployments/*.json; do \
			if [ -f "$$file" ]; then \
				echo "$(YELLOW)📄 $$file:$(NC)"; \
				cat "$$file" | jq .; \
				echo ""; \
			fi; \
		done; \
		echo "$(GREEN)✅ Found $$(ls contracts/deployments/*.json 2>/dev/null | wc -l) deployment files$(NC)"; \
	else \
		echo "$(RED)❌ No deployments found$(NC)"; \
		echo "Run: make deploy-matsnet-all"; \
	fi

deployments-matsnet: ## Show Matsnet specific deployments
	@echo "$(BLUE)Matsnet Deployment Status:$(NC)"
	@echo ""
	@if [ -f contracts/deployments/integrations-11155111.json ]; then \
		echo "$(GREEN)✅ Integrations deployed:$(NC)"; \
		cat contracts/deployments/integrations-11155111.json | jq .; \
		echo ""; \
	else \
		echo "$(RED)❌ Integrations not deployed$(NC)"; \
	fi
	@if [ -f contracts/deployments/pools-11155111.json ]; then \
		echo "$(GREEN)✅ Pools deployed:$(NC)"; \
		cat contracts/deployments/pools-11155111.json | jq .; \
	else \
		echo "$(RED)❌ Pools not deployed$(NC)"; \
	fi

gas-snapshot: ## Create gas usage snapshot
	@echo "$(BLUE)Creating gas snapshot...$(NC)"
	cd contracts && forge snapshot
	@echo "$(GREEN)✓ Gas snapshot saved to .gas-snapshot$(NC)"

format: ## Format code with forge fmt
	@echo "$(BLUE)Formatting Solidity code...$(NC)"
	cd contracts && forge fmt
	@echo "$(GREEN)✓ Code formatted$(NC)"

lint: ## Lint contracts
	@echo "$(BLUE)Linting contracts...$(NC)"
	cd contracts && forge fmt --check
	@echo "$(GREEN)✓ Linting complete$(NC)"

docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	cd contracts && forge doc
	@echo "$(GREEN)✓ Documentation generated$(NC)"

##@ Info

info: ## Show project information
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                    KhipuVault Info                         ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Project Structure:$(NC)"
	@echo "  📁 contracts/    - Smart contracts (Solidity + Foundry)"
	@echo "  📁 frontend/     - React + TypeScript frontend"
	@echo "  📁 services/     - Backend services (Node.js)"
	@echo "  📁 tests/        - Integration tests"
	@echo "  📁 docs/         - Documentation"
	@echo ""
	@echo "$(YELLOW)Contracts:$(NC)"
	@echo "  💡 IndividualPool    - Personal savings"
	@echo "  🤝 CooperativePool   - Community pools"
	@echo "  🎰 LotteryPool       - No-loss lottery"
	@echo "  🔄 RotatingPool      - ROSCA implementation"
	@echo ""
	@echo "$(YELLOW)Integrations:$(NC)"
	@echo "  ⚡ MezoIntegration   - BTC collateral & MUSD"
	@echo "  📈 YieldAggregator   - DeFi yield strategies"
	@echo ""
	@cd contracts && echo "$(YELLOW)Foundry Version:$(NC) $$(forge --version | head -n 1)"
	@echo ""
	@echo "For help: make help"

version: ## Show versions of tools
	@echo "$(BLUE)Tool Versions:$(NC)"
	@forge --version | head -n 1
	@cast --version | head -n 1
	@anvil --version | head -n 1
	@node --version | sed 's/^/Node: /'
	@npm --version | sed 's/^/npm: /'