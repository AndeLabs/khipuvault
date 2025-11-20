.PHONY: anvil deploy-mocks test-deposit help

# Default target
help:
	@echo "Available commands:"
	@echo "  make anvil          - Start local Anvil node"
	@echo "  make deploy-mocks   - Deploy mock contracts to Anvil"
	@echo "  make test-deposit   - Test deposit with mocks"
	@echo "  make all            - Run anvil + deploy-mocks"

# Start Anvil local node
anvil:
	@echo "Starting Anvil local node..."
	anvil --host 0.0.0.0 --port 8545 --chain-id 31337

# Deploy mocks to Anvil
deploy-mocks:
	@echo "Deploying mock contracts..."
	forge script scripts/DeployMocks.s.sol \
		--rpc-url http://localhost:8545 \
		--broadcast \
		--private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Test deposit
test-deposit:
	@echo "Testing deposit..."
	cast send $(POOL_ADDRESS) \
		"deposit()" \
		--value 0.01ether \
		--rpc-url http://localhost:8545 \
		--private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Run everything
all: anvil deploy-mocks
