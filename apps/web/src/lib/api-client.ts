/**
 * Centralized API client configuration
 * Uses @khipu/web3 KhipuApiClient
 */

import { KhipuApiClient } from "@khipu/web3";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const apiClient = new KhipuApiClient(API_URL);

export default apiClient;
