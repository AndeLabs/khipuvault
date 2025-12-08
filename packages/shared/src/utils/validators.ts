import {
  MIN_DEPOSIT_MUSD,
  MAX_DEPOSIT_MUSD,
  MIN_WITHDRAW_MUSD,
} from "../constants/pools";

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate deposit amount
 */
export function isValidDepositAmount(amount: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const amountBigInt = BigInt(amount);
    const minDeposit = BigInt(MIN_DEPOSIT_MUSD);
    const maxDeposit = BigInt(MAX_DEPOSIT_MUSD);

    if (amountBigInt < minDeposit) {
      return { valid: false, error: `Minimum deposit is 10 MUSD` };
    }
    if (amountBigInt > maxDeposit) {
      return { valid: false, error: `Maximum deposit is 100,000 MUSD` };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid amount format" };
  }
}

/**
 * Validate withdraw amount
 */
export function isValidWithdrawAmount(
  amount: string,
  balance: string,
): { valid: boolean; error?: string } {
  try {
    const amountBigInt = BigInt(amount);
    const balanceBigInt = BigInt(balance);
    const minWithdraw = BigInt(MIN_WITHDRAW_MUSD);

    if (amountBigInt < minWithdraw) {
      return { valid: false, error: `Minimum withdraw is 1 MUSD` };
    }
    if (amountBigInt > balanceBigInt) {
      return { valid: false, error: `Insufficient balance` };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid amount format" };
  }
}

/**
 * Validate transaction hash
 */
export function isValidTxHash(txHash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(txHash);
}
