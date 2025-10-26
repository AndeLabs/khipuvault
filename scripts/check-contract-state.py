#!/usr/bin/env python3
"""
Script to check the state of IndividualPool, CooperativePool, and YieldAggregator contracts.
Verifies if they are paused and if YieldAggregator has configured vaults.

Usage:
    python scripts/check-contract-state.py

Requirements:
    pip install web3
"""

import json
import sys
from web3 import Web3

# Configuration
MEZO_TESTNET_RPC = "https://testnet-rpc.mezo.org"
CHAIN_ID = 31611

# Contract Addresses
INDIVIDUAL_POOL = "0xC2c7c8E1325Ec049302F225c8A0151E561F446Ed"
COOPERATIVE_POOL = "0xDDe8c75271E454075BD2f348213A66B142BB8906"
YIELD_AGGREGATOR = "0xfB3265402f388d72a9b63353b4a7BeeC4fD9De4c"
MEZO_INTEGRATION = "0x9AC6249d2f2E3cbAAF34E114EdF1Cb7519AF04C2"

# Minimal ABIs for checking state
PAUSABLE_ABI = [
    {
        "inputs": [],
        "name": "paused",
        "outputs": [{"type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
]

YIELD_AGGREGATOR_ABI = PAUSABLE_ABI + [
    {
        "inputs": [],
        "name": "depositsPaused",
        "outputs": [{"type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "activeVaultsList",
        "outputs": [{"type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    }
]

def check_contract_paused(w3, contract_address, contract_name):
    """Check if a Pausable contract is paused"""
    try:
        contract = w3.eth.contract(address=contract_address, abi=PAUSABLE_ABI)
        is_paused = contract.functions.paused().call()
        return is_paused
    except Exception as e:
        print(f"❌ Error checking {contract_name}: {e}")
        return None

def check_yield_aggregator_state(w3):
    """Check YieldAggregator state in detail"""
    try:
        contract = w3.eth.contract(address=YIELD_AGGREGATOR, abi=YIELD_AGGREGATOR_ABI)
        
        is_paused = contract.functions.paused().call()
        deposits_paused = contract.functions.depositsPaused().call()
        vaults = contract.functions.activeVaultsList().call()
        
        return {
            "paused": is_paused,
            "deposits_paused": deposits_paused,
            "num_vaults": len(vaults),
            "vaults": vaults
        }
    except Exception as e:
        print(f"❌ Error checking YieldAggregator: {e}")
        return None

def main():
    """Main function"""
    print("=" * 60)
    print("🔍 Contract State Checker - KhipuVault")
    print("=" * 60)
    print(f"Network: Mezo Testnet (Chain ID: {CHAIN_ID})")
    print(f"RPC: {MEZO_TESTNET_RPC}")
    print()
    
    # Connect to network
    try:
        w3 = Web3(Web3.HTTPProvider(MEZO_TESTNET_RPC))
        if not w3.is_connected():
            print("❌ Failed to connect to Mezo Testnet RPC")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Connection error: {e}")
        sys.exit(1)
    
    print(f"✓ Connected to Mezo Testnet (Block: {w3.eth.block_number})")
    print()
    
    # Check each contract
    print("Contract Status:")
    print("-" * 60)
    
    # IndividualPool
    ind_paused = check_contract_paused(w3, INDIVIDUAL_POOL, "IndividualPool")
    if ind_paused is None:
        print("❓ IndividualPool: Status unknown")
    else:
        status = "🔴 PAUSED" if ind_paused else "🟢 ACTIVE"
        print(f"IndividualPool: {status}")
    
    # CooperativePool
    coop_paused = check_contract_paused(w3, COOPERATIVE_POOL, "CooperativePool")
    if coop_paused is None:
        print("❓ CooperativePool: Status unknown")
    else:
        status = "🔴 PAUSED" if coop_paused else "🟢 ACTIVE"
        print(f"CooperativePool: {status}")
    
    # YieldAggregator (detailed)
    print()
    print("YieldAggregator Details:")
    print("-" * 60)
    agg_state = check_yield_aggregator_state(w3)
    if agg_state:
        agg_status = "🔴 PAUSED" if agg_state["paused"] else "🟢 ACTIVE"
        deposits_status = "🔴 PAUSED" if agg_state["deposits_paused"] else "🟢 ENABLED"
        
        print(f"  Status: {agg_status}")
        print(f"  Deposits: {deposits_status}")
        print(f"  Configured Vaults: {agg_state['num_vaults']}")
        
        if agg_state['num_vaults'] == 0:
            print("  ⚠️  WARNING: No vaults configured!")
        else:
            print("  Vaults:")
            for vault in agg_state['vaults']:
                print(f"    - {vault}")
    
    print()
    print("=" * 60)
    print("Summary:")
    print("-" * 60)
    
    # Determine if deposits will work
    can_deposit = True
    issues = []
    
    if ind_paused:
        can_deposit = False
        issues.append("❌ IndividualPool is paused")
    
    if agg_state:
        if agg_state["paused"]:
            can_deposit = False
            issues.append("❌ YieldAggregator is paused")
        
        if agg_state["deposits_paused"]:
            can_deposit = False
            issues.append("❌ YieldAggregator deposits are paused")
        
        if agg_state["num_vaults"] == 0:
            can_deposit = False
            issues.append("❌ No vaults configured in YieldAggregator")
    
    if can_deposit:
        print("✅ All checks passed - Deposits should work!")
    else:
        print("⚠️  Issues found preventing deposits:")
        for issue in issues:
            print(f"  {issue}")
        print()
        print("To fix:")
        print("  1. Run: bash scripts/unpause-contracts.sh")
        print("  2. Ensure DEPLOYER_PRIVATE_KEY environment variable is set")
        print("  3. Ensure MEZO_TESTNET_RPC environment variable is set (optional)")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
