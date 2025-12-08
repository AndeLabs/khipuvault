export const POOL_TYPES = {
  INDIVIDUAL: "individual",
  COOPERATIVE: "cooperative",
  LOTTERY: "lottery",
  ROTATING: "rotating",
} as const;

export const POOL_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  EMERGENCY: "emergency",
  CLOSED: "closed",
} as const;

export const MIN_DEPOSIT_MUSD = "10000000000000000000"; // 10 MUSD
export const MAX_DEPOSIT_MUSD = "100000000000000000000000"; // 100,000 MUSD
export const MIN_WITHDRAW_MUSD = "1000000000000000000"; // 1 MUSD

export const PERFORMANCE_FEE_BPS = 100; // 1%
export const REFERRAL_BONUS_BPS = 50; // 0.5%
