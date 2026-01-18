import { KhipuApiClient } from "@khipu/web3";

import { captureError } from "@/lib/error-tracking";

const apiClient = new KhipuApiClient(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
);

/**
 * Fetch user portfolio data
 * @throws Error if the request fails - let React Query handle retries
 */
export async function getUserPortfolio(address: string) {
  try {
    return await apiClient.getUserPortfolio(address);
  } catch (error) {
    await captureError(error, {
      tags: { api: "portfolio", operation: "getUserPortfolio" },
      extra: { address },
    });
    throw error; // Re-throw for React Query error handling
  }
}

/**
 * Fetch user transaction history
 * @throws Error if the request fails - let React Query handle retries
 */
export async function getUserTransactions(address: string) {
  try {
    return await apiClient.getUserTransactions(address);
  } catch (error) {
    await captureError(error, {
      tags: { api: "portfolio", operation: "getUserTransactions" },
      extra: { address },
    });
    throw error; // Re-throw for React Query error handling
  }
}

/**
 * Fetch all pools
 * @throws Error if the request fails - let React Query handle retries
 */
export async function getAllPools() {
  try {
    return await apiClient.getPools();
  } catch (error) {
    await captureError(error, {
      tags: { api: "portfolio", operation: "getAllPools" },
    });
    throw error; // Re-throw for React Query error handling
  }
}
