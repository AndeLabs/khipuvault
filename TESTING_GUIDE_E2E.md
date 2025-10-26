# KhipuVault End-to-End Testing Guide

**Status**: Ready for Production Testing  
**Model**: MUSD-Only (Simplified)  
**Last Updated**: Oct 24, 2025

---

## Overview

This guide covers testing the complete KhipuVault flow with the MUSD-only model where:
1. Users get MUSD at mezo.org
2. Users approve MUSD to KhipuVault
3. Users deposit MUSD to earn yields
4. Users claim yields or withdraw

All transactions are in MUSD. No BTC conversions.

---

## Setup Requirements

### Prerequisite: Get MUSD

Before testing ANY deposit flows:

1. **Go to mezo.org** (Mezo Testnet)
2. **Deposit BTC** as collateral (you'll get some test BTC from faucet if needed)
3. **Borrow MUSD** (minimal amount like 50-100 MUSD)
4. **Transfer to test wallet** address

Without MUSD, deposit tests will fail immediately with "Insufficient balance".

---

## Test Scenarios

### 1. Wallet Connection & Balance Display ✅

**Goal**: Verify UI shows correct MUSD balance after wallet connection

**Steps**:
1. Open `/dashboard/individual-savings`
2. Click "Conectar" (Connect Wallet)
3. Select wallet and sign transaction
4. Verify displayed balance matches wallet's actual MUSD balance

**Expected Result**:
- ✅ Wallet connects successfully
- ✅ MUSD balance displays in "Balance MUSD" field
- ✅ Shows formatted MUSD amount (e.g., "100.00 MUSD")

**Failure Scenarios**:
- ❌ If balance shows "0.00 MUSD" but you have MUSD → Check token address (should be `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`)
- ❌ If balance is NaN or undefined → Check `use-musd-approval` hook is loading correctly

---

### 2. MUSD Approval Flow ✅

**Goal**: Verify MUSD approval before deposits

**Steps**:
1. Connected wallet with MUSD balance
2. Click "Añadir Fondos" (Add Funds)
3. Dialog shows MUSD amount to deposit
4. First click should show "Aprobar MUSD" button
5. Click "Aprobar MUSD"
6. Approve transaction in wallet
7. Wait for confirmation
8. Button should change to "Confirmar Depósito"

**Expected Result**:
- ✅ First dialog shows yellow warning: "Necesitas aprobar MUSD primero"
- ✅ Button text changes to "Aprobar MUSD"
- ✅ After approval, button changes to "Confirmar Depósito"
- ✅ No transaction errors

**Failure Scenarios**:
- ❌ **Button stuck on "Aprobar MUSD"**: Approval tx failed (check wallet logs)
- ❌ **No yellow warning**: Check `needsApproval()` logic in deposits component
- ❌ **Approval succeeds but can't deposit**: May need higher approval amount, try approving infinite amount

---

### 3. MUSD Deposit Flow ✅

**Goal**: Verify successful MUSD deposit to pool

**Steps**:
1. Complete approval flow (see Test #2)
2. Click "Confirmar Depósito"
3. Sign transaction in wallet
4. Wait for confirmation (~30 seconds on testnet)
5. Verify UI updates

**Expected Result**:
- ✅ Deposit tx submitted and confirmed
- ✅ "Depósito exitoso" toast notification appears
- ✅ Deposit dialog closes automatically
- ✅ YourPosition updates to show deposited MUSD
- ✅ Deposits component shows user's deposit
- ✅ SummaryCards shows deposit in "Depósitos Activos"

**Failure Scenarios**:
- ❌ **"Insufficient balance for transfer"**: MUSD balance is 0 or amount > balance
- ❌ **"Approval failed"**: User didn't approve enough MUSD (go back to Test #2)
- ❌ **"Min deposit not met"**: Amount < 10 MUSD (contract minimum)
- ❌ **"Max deposit exceeded"**: Amount > 100,000 MUSD (contract maximum)

---

### 4. Yield Accumulation & Display ✅

**Goal**: Verify yields accrue and display correctly

**Steps**:
1. Successfully deposit MUSD (Test #3)
2. Wait 1-2 minutes (yields accumulate in real time)
3. Refresh page or wait for component to refetch data
4. Check "Rendimientos Acumulados" field in YourPosition

**Expected Result**:
- ✅ After 1-2 minutes: "Rendimientos Acumulados" shows > 0 MUSD
- ✅ Amount increases over time
- ✅ "Reclamar" button becomes enabled
- ✅ Button text shows "Reclamar X.XX MUSD"

**Calculation**:
- APR is 6.2% on MUSD
- Per minute: `(6.2% / 365 / 24 / 60) * deposit amount`
- Example: 100 MUSD → ~0.00118 MUSD per minute

**Failure Scenarios**:
- ❌ **Yields stay at 0**: May not have waited long enough (wait 5 minutes)
- ❌ **Yields show as negative**: Bug in calculation (check hook)
- ❌ **Doesn't update after refresh**: Frontend cache issue, clear browser cache

---

### 5. Claim Yield Flow ✅

**Goal**: Verify yield claiming works correctly

**Steps**:
1. Successfully deposit MUSD with accrued yields (Tests #3-4)
2. Click "Reclamar X.XX MUSD" button
3. Sign transaction in wallet
4. Wait for confirmation
5. Verify UI updates

**Expected Result**:
- ✅ Yield claim tx submitted and confirmed
- ✅ "Yield reclamado" toast notification
- ✅ "Rendimientos Acumulados" resets to ~0 MUSD
- ✅ MUSD balance increases by (yield amount - 1% fee)
- ✅ Button becomes disabled again until new yields accrue

**Fee Calculation**:
- Performance fee: 1% of claimed yields
- If yields = 1 MUSD, net received = 0.99 MUSD
- Remaining 0.01 MUSD goes to feeCollector

**Failure Scenarios**:
- ❌ **"No yields to claim"**: Yields amount is 0 or null
- ❌ **Claim fails with revert**: Check if pool has sufficient liquidity

---

### 6. Withdrawal Flow ✅

**Goal**: Verify MUSD withdrawal from pool

**Steps**:
1. Successfully deposit MUSD with some yields (Tests #3-4)
2. Click "Retirar" (Withdraw)
3. Set withdrawal amount in dialog
4. Click "Confirmar Retiro"
5. Sign transaction
6. Wait for confirmation

**Expected Result**:
- ✅ Withdrawal tx submitted and confirmed
- ✅ "Retiro exitoso" toast notification
- ✅ User receives: principal MUSD + accrued yields
- ✅ YourPosition updates: deposits return to 0, yields return to 0
- ✅ Wallet MUSD balance increases
- ✅ Button becomes disabled (no active deposit)

**Withdrawal Display**:
Shows breakdown: "Total MUSD (Principal + Yield)"
- Example: "150.50 MUSD (100.00 + 50.50 yield)"

**Failure Scenarios**:
- ❌ **"Withdrawal amount too high"**: Trying to withdraw more than deposited + yields
- ❌ **"Min withdrawal not met"**: Amount < 1 MUSD
- ❌ **Withdrawal fails**: Pool might be paused or in emergency

---

### 7. Transaction History ✅

**Goal**: Verify transactions display correctly in table

**Steps**:
1. Complete deposit, claim, and withdrawal flows
2. Check "Transacciones Recientes" table
3. Verify all transactions appear with correct details

**Expected Result**:
- ✅ Deposit shows as "Depósito" with MUSD amount
- ✅ Yield claim shows as "Reclamo Yield" with net yield (after fee)
- ✅ Withdrawal shows as "Retiro" with "principal + yield" breakdown
- ✅ All show correct date and timestamp
- ✅ Status shows "Confirmado" for all
- ✅ TX hash links to Mezo explorer

**Transaction Display Examples**:
```
| Fecha | Tipo | Monto | Estado | TX Hash |
|-------|------|-------|--------|---------|
| 24/10/2025 | Depósito | 100.00 MUSD | Confirmado | 0x1234...5678 |
| 24/10/2025 | Reclamo Yield | 0.99 MUSD (1.00 - 0.01 fee) | Confirmado | 0x2345...6789 |
| 24/10/2025 | Retiro | 150.50 MUSD (100.00 + 50.50 yield) | Confirmado | 0x3456...7890 |
```

**Failure Scenarios**:
- ❌ **Table shows "No tienes transacciones"**: Transactions might be > 33 hours old (RPC limit)
- ❌ **Wrong amounts displayed**: Check event parsing in `use-user-transactions` hook
- ❌ **TX hash doesn't link correctly**: Check explorer URL in hook

---

## Error Handling Tests

### 8. Insufficient MUSD Balance ❌

**Goal**: Verify graceful error when balance is too low

**Steps**:
1. Open deposit dialog
2. Try to deposit more than your MUSD balance
3. Input amount > balance

**Expected Result**:
- ✅ Input validation prevents submission
- ✅ Max slider shows available balance
- ✅ Warning or error message if amount > balance
- ✅ "Confirmar Depósito" button disabled

---

### 9. Approval Rejection ❌

**Goal**: Verify behavior when user rejects approval

**Steps**:
1. Click "Añadir Fondos"
2. Click "Aprobar MUSD"
3. Reject approval in wallet popup

**Expected Result**:
- ✅ Dialog stays open
- ✅ Button remains "Aprobar MUSD"
- ✅ Error toast: "Error en aprobación"
- ✅ User can retry approval

---

### 10. Deposit Rejection ❌

**Goal**: Verify behavior when user rejects deposit

**Steps**:
1. Complete approval (Test #2)
2. Click "Confirmar Depósito"
3. Reject transaction in wallet

**Expected Result**:
- ✅ Dialog stays open
- ✅ Button remains "Confirmar Depósito"
- ✅ Error toast: "Error en depósito"
- ✅ User can retry deposit

---

### 11. Network Errors ❌

**Goal**: Verify behavior during network issues

**Steps**:
1. Throttle network to "Slow 3G" in DevTools
2. Attempt deposit flow
3. Observe loading states

**Expected Result**:
- ✅ Loading indicators show: "Aprobando...", "Depositando..."
- ✅ Transaction eventually confirms (or fails with error)
- ✅ No stuck/frozen UI
- ✅ User can close dialog and retry

---

### 12. No MUSD Available ⚠️

**Goal**: Verify UI when user has no MUSD

**Steps**:
1. Connect wallet with 0 MUSD balance
2. Observe Deposits component

**Expected Result**:
- ✅ "Añadir Fondos" button disabled
- ✅ Blue info box appears: "No tienes MUSD. Obtén MUSD en Mezo primero:"
- ✅ "Ir a mezo.org" link provides external navigation
- ✅ Clear call-to-action for new users

---

## Projections Calculator Tests

### 13. Yield Projections ✅

**Goal**: Verify projection calculator works with MUSD

**Steps**:
1. Go to bottom section "Calculadora de Proyecciones"
2. Set different MUSD amounts (100, 500, 1000)
3. Select different periods (1 month, 3 months, 6 months, 1 year)
4. Verify calculations

**Formula**:
```
finalCapital = deposit * (1 + APR/12)^months
earnings = finalCapital - deposit
ROI = (earnings / deposit) * 100%
```

**Example** (100 MUSD, 1 year, 6.2% APR):
```
finalCapital = 100 * (1 + 0.062/12)^12 = 106.39 MUSD
earnings = 6.39 MUSD
ROI = 6.39%
```

**Expected Result**:
- ✅ Shows amounts in MUSD (not BTC)
- ✅ Calculations match formula
- ✅ Slider adjusts amount smoothly
- ✅ Period dropdown changes correctly

---

## UI/UX Tests

### 14. Responsive Design ✅

**Goal**: Verify UI works on mobile, tablet, desktop

**Steps**:
1. Test on widths: 375px (mobile), 768px (tablet), 1920px (desktop)
2. Verify components stack/resize appropriately

**Expected Result**:
- ✅ Layout adapts (grid-cols-1 on mobile, grid-cols-2 on desktop)
- ✅ All buttons remain clickable
- ✅ Text readable
- ✅ Tables scroll horizontally on mobile

---

### 15. Dark Mode Consistency ✅

**Goal**: Verify UI looks correct in dark theme

**Expected Result**:
- ✅ All text readable (sufficient contrast)
- ✅ Buttons clearly visible
- ✅ Cards have proper background
- ✅ No unreadable gray-on-gray text

---

## Performance Tests

### 16. Load Time ⏱️

**Goal**: Verify page loads in reasonable time

**Expected Result**:
- ✅ Initial page load: < 3 seconds
- ✅ Data fetch (userDeposits, poolStats): < 2 seconds
- ✅ Transaction confirmation: < 1 minute on testnet

---

### 17. Component Refetch ♻️

**Goal**: Verify data refreshes without full page reload

**Steps**:
1. Deposit MUSD
2. Check YourPosition component
3. Wait 1 minute
4. Verify yields update WITHOUT manual refresh

**Expected Result**:
- ✅ Components refetch data periodically
- ✅ Yields increase in real-time
- ✅ No full page reload needed

---

## Checklist: Ready for Production

- [ ] All 17 test scenarios pass
- [ ] No console errors
- [ ] Network requests are clean (no 404s)
- [ ] Transactions confirm on actual testnet
- [ ] Error messages are clear to users
- [ ] MUSD amounts formatted consistently
- [ ] Contract ABIs match deployed contracts
- [ ] Environment variables set correctly
- [ ] Gas estimates are reasonable
- [ ] Loading states work properly
- [ ] Mobile responsive tested
- [ ] Dark mode verified
- [ ] Transaction history displays correctly
- [ ] Approval workflow intuitive
- [ ] Error recovery possible

---

## Quick Start: Manual Testing

```bash
# 1. Start dev server
cd frontend
npm run dev

# 2. Open in browser
open http://localhost:3000/dashboard/individual-savings

# 3. Connect wallet with MUSD on Mezo Testnet
# Network ID: 31611
# RPC: https://testnet-rpc.mezo.org

# 4. Follow test scenarios above
```

---

## Contract Details

**Network**: Mezo Testnet (31611)

**Contracts**:
- IndividualPool: `0xC2c7c8E1325Ec049302F225c8A0151E561F446Ed`
- MUSD Token: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`

**Limits**:
- Min deposit: 10 MUSD
- Max deposit: 100,000 MUSD
- Performance fee: 1% (on claimed yields)
- APR: 6.2%

---

## Troubleshooting

### Transaction fails with "Insufficient allowance"
→ Go back to Test #2 and approve more MUSD

### Balance shows 0 but I have MUSD
→ Check contract address matches MUSD on your network
→ Try adding token to wallet manually

### Yields not showing
→ Wait at least 5 minutes after deposit
→ Refresh page to trigger refetch
→ Check pool hasn't been paused

### Transaction pending forever
→ Check Mezo testnet status at [https://status.mezo.org](https://status.mezo.org)
→ Restart browser and reconnect wallet

---

**Good luck with testing! All 17 scenarios should pass before production release.**
