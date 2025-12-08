import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { TESTNET_ADDRESSES } from "../addresses";
// TODO: Import ABI when generated
// import { IndividualPoolV3Abi } from '../abis'

/**
 * Hook para interactuar con IndividualPool V3
 */
export function useIndividualPool() {
  // Read functions
  const { data: userInfo } = useReadContract({
    address: TESTNET_ADDRESSES.INDIVIDUAL_POOL,
    abi: [], // TODO: Add ABI
    functionName: "getUserInfo",
  });

  const { data: pendingYield } = useReadContract({
    address: TESTNET_ADDRESSES.INDIVIDUAL_POOL,
    abi: [], // TODO: Add ABI
    functionName: "getPendingYield",
  });

  // Write functions
  const { writeContract: deposit, data: depositHash } = useWriteContract();
  const { writeContract: withdraw, data: withdrawHash } = useWriteContract();
  const { writeContract: claimYield, data: claimHash } = useWriteContract();

  // Transaction confirmations
  const { isLoading: isDepositConfirming } = useWaitForTransactionReceipt({
    hash: depositHash,
  });
  const { isLoading: isWithdrawConfirming } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });
  const { isLoading: isClaimConfirming } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  return {
    // Read data
    userInfo,
    pendingYield,

    // Write functions
    deposit,
    withdraw,
    claimYield,

    // Loading states
    isDepositConfirming,
    isWithdrawConfirming,
    isClaimConfirming,

    // Transaction hashes
    depositHash,
    withdrawHash,
    claimHash,
  };
}
