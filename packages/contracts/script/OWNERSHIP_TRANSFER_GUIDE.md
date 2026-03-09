# KhipuVault Ownership Transfer Guide

This guide explains how to safely transfer ownership of all KhipuVault contracts from an EOA (Externally Owned Account) to a Gnosis Safe multi-sig wallet.

## Why Transfer to Multi-sig?

For production deployments, using a multi-sig wallet provides:

- **Security**: Requires multiple signers to approve transactions
- **Decentralization**: No single point of failure
- **Transparency**: All signers can see proposed transactions
- **Recovery**: Multiple signers reduce risk of lost keys
- **Best Practice**: Industry standard for DeFi protocols

## Pre-requisites

### 1. Deploy a Gnosis Safe

Visit [Gnosis Safe](https://app.safe.global) and deploy a multi-sig on your network:

**Recommended Configuration:**

- **Mainnet**: 3/5 (3 signatures required out of 5 signers)
- **Testnet**: 2/3 (2 signatures required out of 3 signers)

**Signers Selection:**

- Choose trusted team members
- Ensure geographic/timezone distribution
- Verify all signers have access to their wallets
- Document signer addresses securely

**Save this information:**

```
Multi-sig Address: 0x...
Signers:
  1. 0x... (Alice - Founder)
  2. 0x... (Bob - CTO)
  3. 0x... (Carol - Operations)
Threshold: 3/5
Network: Mezo Mainnet (Chain ID: 31612)
```

### 2. Test Multi-sig Access

Before transferring ownership:

1. All signers should connect to the Safe interface
2. Create a test transaction (e.g., send 0.001 ETH to yourself)
3. Practice the signature collection process
4. Confirm all signers can approve transactions

### 3. Prepare Contract Addresses

Gather all deployed contract addresses from your deployment:

```bash
# From Deploy.s.sol output or PostDeployVerify.s.sol
YIELD_AGGREGATOR=0x...
MEZO_INTEGRATION=0x...
INDIVIDUAL_POOL=0x...
COOPERATIVE_POOL=0x...
LOTTERY_POOL=0x...
ROTATING_POOL=0x...
STABILITY_POOL_STRATEGY=0x...  # If deployed
```

## Step-by-Step Transfer Process

### Step 1: Update Script Configuration

Edit `script/TransferOwnership.s.sol`:

```solidity
// Line 57: Update with your Gnosis Safe address
address constant MULTI_SIG_ADDRESS = 0xYourGnosisSafeAddress;

// Lines 60-66: Update with your deployed contract addresses
address constant YIELD_AGGREGATOR = 0x...;
address constant MEZO_INTEGRATION = 0x...;
address constant INDIVIDUAL_POOL = 0x...;
address constant COOPERATIVE_POOL = 0x...;
address constant LOTTERY_POOL = 0x...;
address constant ROTATING_POOL = 0x...;
address constant STABILITY_POOL_STRATEGY = 0x...;  // Or address(0) if not deployed
```

### Step 2: Dry Run Verification

Run the script without broadcasting to verify configuration:

```bash
forge script script/TransferOwnership.s.sol \
  --rpc-url $RPC_URL \
  -vvvv
```

**Expected Output:**

```
==============================================
    TRANSFER OWNERSHIP TO MULTI-SIG
==============================================

Current Owner (EOA):  0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257
New Owner (Multi-sig): 0xYourGnosisSafeAddress
Network:              Mezo Testnet

>>> Pre-flight checks...
[OK] Multi-sig address validated (is contract)
    [OK] YieldAggregatorV3 - owner: 0x8e7E...
    [OK] MezoIntegrationV3 - owner: 0x8e7E...
    ...
[OK] All ownership checks passed
```

**If you see errors:**

- `Multi-sig address is zero!` → Update MULTI_SIG_ADDRESS
- `Multi-sig address is not a contract!` → Verify Safe is deployed
- `unexpected owner` → You're not the current owner

### Step 3: Execute Transfer (Testnet First!)

**IMPORTANT:** Always test on testnet before mainnet!

```bash
# Testnet transfer
forge script script/TransferOwnership.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  -vvvv
```

**Review the output carefully:**

```
>>> Transferring YieldAggregatorV3...
    [SUCCESS] Ownership transferred
      From: 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257
      To:   0xYourGnosisSafeAddress

>>> Transferring MezoIntegrationV3...
    [SUCCESS] Ownership transferred
      From: 0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257
      To:   0xYourGnosisSafeAddress

...

==============================================
           TRANSFER SUMMARY
==============================================

[SUCCESS] YieldAggregatorV3
  Address: 0x...
  Old Owner: 0x8e7E...
  New Owner: 0xYourGnosisSafeAddress

...

Results:
  Successful: 7
  Failed: 0

[SUCCESS] All ownership transfers completed!
```

**If any transfers fail:**

1. Note which contracts failed and why
2. The script is idempotent - you can re-run it
3. Only failed transfers will be retried

### Step 4: Verify Transfer

Run the verification script to confirm all contracts are owned by multi-sig:

```bash
forge script script/VerifyOwnership.s.sol \
  --rpc-url $RPC_URL \
  -vvvv
```

Update `EXPECTED_MULTI_SIG` in `VerifyOwnership.s.sol` first!

**Expected Output:**

```
==============================================
      OWNERSHIP VERIFICATION REPORT
==============================================

Expected Owner:      0xYourGnosisSafeAddress
Network:             Mezo Testnet

[PASS] Multi-sig is a contract
       Code size: 1234 bytes

>>> Checking Contract Ownership

    [PASS] YieldAggregatorV3
      Owner: 0xYourGnosisSafeAddress

    [PASS] MezoIntegrationV3
      Owner: 0xYourGnosisSafeAddress

    ...
```

**All checks should show [PASS]. If you see [FAIL]:**

- Review the remediation steps in the output
- Re-run TransferOwnership.s.sol if needed

### Step 5: Test Multi-sig Admin Functions

Before considering the transfer complete, test that the multi-sig can execute admin functions:

#### Test 1: Pause/Unpause Contract

```bash
# Via Gnosis Safe interface:
# 1. Go to https://app.safe.global
# 2. Select your Safe
# 3. Click "New Transaction" → "Contract Interaction"
# 4. Enter contract address (e.g., IndividualPoolV3)
# 5. Select function: pause()
# 6. Submit and collect signatures
# 7. Execute transaction
# 8. Verify contract is paused
# 9. Repeat with unpause()
```

#### Test 2: Update Configuration

```bash
# Test updating a non-critical parameter
# Example: Set authorized caller in YieldAggregator
# Function: setAuthorizedCaller(address, bool)
# This tests write operations work correctly
```

#### Test 3: Emergency Functions

**DO NOT test emergency withdrawals on mainnet with real funds!**

On testnet only:

```bash
# Test emergency pause if implemented
# Verify all signers can respond quickly
```

### Step 6: Mainnet Transfer

Once testnet transfer is verified and multi-sig is tested:

1. **Update script with mainnet addresses**

   ```solidity
   // Use mainnet contract addresses
   address constant MULTI_SIG_ADDRESS = 0xMainnetGnosisSafe;
   address constant YIELD_AGGREGATOR = 0xMainnetYieldAgg;
   // ... etc
   ```

2. **Coordinate with multi-sig signers**
   - Schedule a time when all signers are available
   - Have signers ready to test admin functions immediately

3. **Execute mainnet transfer**

   ```bash
   forge script script/TransferOwnership.s.sol \
     --rpc-url https://rpc.mezo.org \
     --private-key $DEPLOYER_PRIVATE_KEY \
     --broadcast \
     -vvvv
   ```

4. **Immediate verification**

   ```bash
   forge script script/VerifyOwnership.s.sol \
     --rpc-url https://rpc.mezo.org \
     -vvvv
   ```

5. **Test admin functions** (as in Step 5)

### Step 7: Documentation and Communication

After successful transfer:

1. **Update Documentation**

   ```markdown
   # Update in README.md or docs/

   ## Contract Ownership

   All contracts are owned by multi-sig: 0xYourGnosisSafeAddress

   Signers: 3/5 threshold

   - Alice (Founder): 0x...
   - Bob (CTO): 0x...
   - Carol (Operations): 0x...

   Date transferred: 2026-03-09
   ```

2. **Update Frontend**

   ```typescript
   // apps/web/src/config/contracts.ts
   export const ADMIN_MULTISIG = "0xYourGnosisSafeAddress";
   ```

3. **Notify Stakeholders**
   - Team members
   - Community (if applicable)
   - Auditors
   - Partners

4. **Update Block Explorer**
   - Add multi-sig as verified contract owner on Etherscan/block explorer
   - Add contract labels for easy identification

## Post-Transfer Operations

### Managing Contracts via Multi-sig

All admin operations now require multi-sig approval:

**Common Operations:**

1. **Pause/Unpause Contracts**
   - Used during upgrades or emergencies
   - Function: `pause()` / `unpause()`

2. **Authorize New Pools**
   - Function: `YieldAggregator.setAuthorizedCaller(address, bool)`
   - Required before new pools can interact

3. **Update Configuration**
   - Fee rates, limits, addresses
   - Various setter functions per contract

4. **Upgrade Contracts** (UUPS)
   - Function: `upgradeTo(address newImplementation)`
   - Requires new implementation to be deployed first
   - See UPGRADE_GUIDE.md for details

5. **Emergency Actions**
   - Emergency withdrawals
   - Token recovery
   - Circuit breakers

### Multi-sig Best Practices

1. **Signature Collection**
   - Use Gnosis Safe UI for proposals
   - All signers should verify transaction details
   - Use simulation tools before execution

2. **Communication**
   - Announce proposals in advance
   - Document reason for each transaction
   - Keep transaction log

3. **Security**
   - Each signer uses hardware wallet
   - Signer keys stored separately (not all in one location)
   - Regular signer key rotation policy

4. **Emergency Response**
   - Define emergency procedures
   - Maintain 24/7 signer availability
   - Pre-approve emergency pause if time-critical

## Troubleshooting

### Issue: "Multi-sig address is not a contract"

**Cause:** MULTI_SIG_ADDRESS is set to an EOA or Safe isn't deployed yet

**Solution:**

1. Verify Safe is deployed: Check block explorer
2. Confirm you're on correct network
3. Ensure Safe address is copied correctly

### Issue: "unexpected owner" error

**Cause:** Current deployer is not the contract owner

**Solution:**

1. Check who is current owner: `cast call $CONTRACT "owner()" --rpc-url $RPC_URL`
2. Current owner must initiate transfer
3. Or contact current owner to transfer to you first

### Issue: Transfer succeeds but verification fails

**Cause:** Addresses mismatch between scripts

**Solution:**

1. Ensure `EXPECTED_MULTI_SIG` in VerifyOwnership.s.sol matches `MULTI_SIG_ADDRESS` in TransferOwnership.s.sol
2. Confirm on-chain: `cast call $CONTRACT "owner()" --rpc-url $RPC_URL`

### Issue: Only some contracts transferred

**Cause:** Partial failure during batch transfer

**Solution:**

1. Re-run TransferOwnership.s.sol
2. Script will skip already-transferred contracts
3. Only failed transfers will be retried

### Issue: Cannot execute admin functions after transfer

**Cause:** Multi-sig transaction not properly signed/executed

**Solution:**

1. Verify ownership transferred: Use VerifyOwnership.s.sol
2. Check threshold: Ensure enough signers approved
3. Check gas: Gnosis Safe transactions need sufficient gas
4. Try simple operation first (like reading state)

## Reverting Transfer (Emergency Only)

**WARNING:** Only the multi-sig can transfer ownership. If transfer completed, there is no reverting without multi-sig approval.

**If you need to revert:**

1. **Multi-sig must approve** new transfer back to EOA
2. **Via Gnosis Safe UI:**
   ```
   Contract: YieldAggregatorV3 (example)
   Function: transferOwnership(address newOwner)
   newOwner: 0xYourEOA
   ```
3. **Collect required signatures**
4. **Execute transaction**
5. **Repeat for all contracts**

## Security Considerations

1. **Irreversible Action**: Once transferred, only multi-sig signers control contracts
2. **Test Thoroughly**: Always test on testnet first
3. **Verify Addresses**: Double-check all addresses before broadcasting
4. **Signer Security**: Compromised signer = partial compromise of system
5. **Threshold Choice**: Balance security (higher threshold) vs availability (lower threshold)
6. **Backup Plan**: Document recovery procedures for signer loss

## Checklist

Use this checklist for ownership transfer:

```
PRE-TRANSFER:
[ ] Gnosis Safe deployed and tested
[ ] All signers have access and tested approval flow
[ ] Contract addresses gathered and verified
[ ] Script addresses updated (TransferOwnership.s.sol)
[ ] Dry run executed successfully
[ ] Team notified of planned transfer

TESTNET TRANSFER:
[ ] Testnet transfer executed
[ ] VerifyOwnership.s.sol shows all [PASS]
[ ] Pause/unpause tested via multi-sig
[ ] Configuration update tested via multi-sig
[ ] All signers can access and sign

MAINNET TRANSFER:
[ ] Mainnet script addresses updated
[ ] Signers standing by for immediate testing
[ ] Mainnet transfer executed
[ ] VerifyOwnership.s.sol shows all [PASS]
[ ] Admin functions tested immediately
[ ] No errors in any transaction

POST-TRANSFER:
[ ] Documentation updated
[ ] Frontend updated
[ ] Team notified
[ ] Block explorer labels added
[ ] Emergency procedures documented
[ ] Success announcement (if applicable)
```

## Support

If you encounter issues during ownership transfer:

1. Review this guide thoroughly
2. Check troubleshooting section
3. Review script output for specific errors
4. Contact: security@khipuvault.com

---

**Last Updated:** 2026-03-09
**Script Version:** 1.0.0
**Network:** Mezo (Testnet: 31611, Mainnet: 31612)
