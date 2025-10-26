# KhipuVault MUSD-Only Model - Quick Reference

**Last Updated**: October 24, 2025  
**Status**: ✅ Production Ready

---

## User Flow at a Glance

```
┌─────────────────────────────────────────────┐
│ 1. User visits mezo.org (not KhipuVault)   │
│    • Deposits BTC as collateral             │
│    • Borrows MUSD                           │
│    • Transfers MUSD to their wallet         │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 2. User opens KhipuVault dashboard         │
│    • Connects wallet                        │
│    • Wallet shows MUSD balance              │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 3. User clicks "Añadir Fondos"             │
│    • Dialog shows MUSD amount               │
│    • First click: "Aprobar MUSD"            │
│    • Second click: "Confirmar Depósito"     │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 4. Yields accrue automatically              │
│    • 6.2% APR on MUSD                       │
│    • YourPosition shows accrued amount      │
│    • "Reclamar" button becomes enabled      │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ 5. User claims yield OR withdraws           │
│    • Claim: yields in wallet - 1% fee       │
│    • Withdraw: principal + all yields       │
│    • Transaction shows in history           │
└─────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Shows | Updates | User Action |
|-----------|-------|---------|-------------|
| **YourPosition** | Deposited MUSD, yields, total available | Refetches every 30s | View only |
| **Deposits** | Deposit/withdraw dialogs | On user submit | Approve, deposit, withdraw |
| **PoolStats** | Total MUSD in pool, total yields, APR | Refetches every 60s | View only |
| **SummaryCards** | MUSD balance, active deposits, yields | Refetches every 30s | Quick overview |
| **ProjectionsCalculator** | Yield projections | Calculates on input change | Plan investments |
| **TransactionsTable** | All user transactions | Fetches on load | View history |

---

## Key Numbers

| Value | Unit | Notes |
|-------|------|-------|
| Min Deposit | 10 | MUSD |
| Max Deposit | 100,000 | MUSD |
| APR | 6.2 | % |
| Performance Fee | 1 | % (on claimed yields) |
| Decimals | 18 | MUSD (ERC20 standard) |
| Display Decimals | 2 | For user readability |
| Block Time | 12 | seconds (Mezo) |
| TX Confirm Time | 20-30 | seconds (testnet) |

---

## Contract Functions Called from Frontend

```typescript
// ERC20 MUSD Approval
musd.approve(poolAddress, musdAmount)

// Deposit MUSD
pool.deposit(musdAmount)

// Read User Data
pool.userDeposits(userAddress)
  → returns {musdAmount, yieldAccrued, timestamp, lastUpdate, active}

// Claim Yield
pool.claimYield()

// Withdraw MUSD
pool.withdraw(musdAmount)

// Read Pool Stats
pool.totalMusdDeposited()
pool.totalYieldsGenerated()
pool.performanceFee()
```

---

## Hook Responsibilities

**`useIndividualPool()`**
- Fetches: `userDeposits`, `totalMusdDeposited`, `totalYieldsGenerated`
- Returns: `poolStats`, `userDeposit`, `walletBalances`, `isLoading`
- Used by: YourPosition, PoolStats, all pool data consumers

**`useMUSDApproval()`**
- Fetches: MUSD balance, current allowance to pool
- Returns: `musdBalance`, `allowance`, `approve()` function, `needsApproval()`
- Used by: Deposits (approval flow)

**`useDepositToPool()`**
- Calls: `IndividualPool.deposit(musdAmount)`
- Returns: `deposit()` function, `isPending`, `txHash`, `receipt`, `error`
- Used by: Deposits component

**`useClaimYield()`**
- Calls: `IndividualPool.claimYield()`
- Returns: `claimYield()` function, `isPending`, `txHash`, `receipt`, `error`
- Used by: YourPosition component

**`useWithdrawFromPool()`**
- Calls: `IndividualPool.withdraw(musdAmount)`
- Returns: `withdraw()` function, `isPending`, `txHash`, `receipt`, `error`
- Used by: Deposits component

**`useUserTransactions()`**
- Fetches: Events from blockchain (Deposited, Withdrawn, YieldClaimed)
- Returns: `transactions[]`, `isLoading`
- Used by: TransactionsTable

---

## Error Messages Users Might See

| Error | Cause | Solution |
|-------|-------|----------|
| "Insufficient balance for transfer" | MUSD balance < amount | Get more MUSD at mezo.org |
| "Approval failed" | User rejected approval | Try again, may retry |
| "Amount too low" | Amount < 10 MUSD | Increase amount |
| "Amount too high" | Amount > 100,000 MUSD | Decrease amount |
| "No yields to claim" | yieldAccrued = 0 | Wait longer for yields |
| "Approval exceeded" | User approved less than needed | Go back to approval step |
| "Network error" | RPC unreachable | Wait and retry |

---

## Testing Quick Checklist

Before deploying to production:

- [ ] Can connect wallet (MetaMask/other)
- [ ] MUSD balance displays correctly
- [ ] Approval flow works (first approve, then deposit)
- [ ] Deposit succeeds with correct TX
- [ ] YourPosition updates after deposit
- [ ] Yields increase over time
- [ ] Can claim yields (user gets paid - 1% fee)
- [ ] Can withdraw (get principal + yields)
- [ ] Transactions appear in history
- [ ] All amounts shown in MUSD (not BTC)
- [ ] Mobile view works properly
- [ ] Dark mode looks good

---

## Files to Review

**For Product/Business**:
1. `MUSD_FRONTEND_COMPLETE.md` - Full status overview
2. `TESTING_GUIDE_E2E.md` - All test scenarios

**For Developers**:
1. `use-individual-pool.ts` - How pool data is fetched
2. `use-pool-transactions.ts` - How transactions are submitted
3. `deposits.tsx` - Complete approval flow implementation
4. `contracts.ts` - ABI definitions

**For QA/Testing**:
1. `TESTING_GUIDE_E2E.md` - Step-by-step test scenarios
2. `SESSION_SUMMARY.md` - What changed in this session

---

## Environment Setup

```bash
# Install dependencies
cd frontend
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run tests (if configured)
npm run test
```

**Environment Variables Needed**:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_here
```

---

## Contract Addresses (Mezo Testnet)

```
Network ID: 31611
RPC: https://testnet-rpc.mezo.org

IndividualPool:  0xC2c7c8E1325Ec049302F225c8A0151E561F446Ed
MUSD Token:      0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
YieldAggregator: 0xfB3265402f388d72a9b63353b4a7BeeC4fD9De4c
```

---

## Common Questions

**Q: Why do users go to mezo.org first?**
A: To convert their BTC to MUSD. KhipuVault only manages yields on MUSD, not collateral.

**Q: What happens to the 1% fee?**
A: Goes to the `feeCollector` address (typically protocol treasury).

**Q: Can users withdraw anytime?**
A: Yes. There's no lock-up period. Just call `withdraw(amount)`.

**Q: How are yields calculated?**
A: 6.2% APR ÷ 365 days ÷ (blocks per day) = yield per block.

**Q: What if the yield aggregator fails?**
A: Users can still withdraw their principal MUSD. Yields may be lost.

**Q: Is there a maximum APR?**
A: No. APR comes from the yield aggregator (could change over time).

**Q: Can users deposit 0 MUSD?**
A: No. Minimum is 10 MUSD.

---

## Deployment Checklist

- [ ] Review all documentation
- [ ] Run full test suite
- [ ] Verify contract addresses
- [ ] Check environment variables
- [ ] Test on Mezo Testnet fully
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive verified
- [ ] Prepare user docs
- [ ] Plan support resources

---

## Support Resources

**For Users**:
1. How to get MUSD: https://mezo.org
2. Wallet setup: MetaMask docs
3. Network addition: https://testnet-rpc.mezo.org

**For Developers**:
1. Mezo docs: https://docs.mezo.org
2. Wagmi docs: https://wagmi.sh
3. Viem docs: https://viem.sh
4. Next.js docs: https://nextjs.org

**For Support**:
1. GitHub Issues: Report bugs
2. Discord: Community support
3. Email: support@khipuvault.com

---

## What's NOT in KhipuVault Anymore

- ❌ BTC deposits
- ❌ CDP (Collateralized Debt Position) management
- ❌ MUSD minting
- ❌ Collateral liquidation
- ❌ Debt management
- ❌ Interest rates on debt

---

## What IS in KhipuVault

- ✅ MUSD deposits
- ✅ Yield aggregation
- ✅ Automatic yield accrual
- ✅ Yield claiming (with 1% fee)
- ✅ Simple withdrawals
- ✅ Transaction history
- ✅ Yield projections
- ✅ Portfolio overview

---

**For more detailed information, see the complete documentation files.**
