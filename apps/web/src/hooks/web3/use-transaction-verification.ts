/**
 * @fileoverview Transaction Verification Hook
 * Verifies transactions via RPC before showing explorer links
 */

'use client'

import { useState, useEffect } from 'react'

interface VerificationResult {
  status: 'loading' | 'verified' | 'error' | 'not_found'
  blockNumber?: string
  blockHash?: string
  gasUsed?: string
  error?: string
}

export function useTransactionVerification(txHash?: string) {
  const [verification, setVerification] = useState<VerificationResult>({
    status: 'loading'
  })

  useEffect(() => {
    if (!txHash) {
      setVerification({ status: 'not_found' })
      return
    }

    const verifyTransaction = async () => {
      try {
        setVerification({ status: 'loading' })

        const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.test.mezo.org'
        
        // First check transaction details
        const txResponse = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionByHash',
            params: [txHash],
            id: 1
          })
        })

        const txData = await txResponse.json()

        if (!txData.result) {
          setVerification({ status: 'not_found' })
          return
        }

        // Get transaction receipt to confirm it was mined
        const receiptResponse = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [txHash],
            id: 1
          })
        })

        const receiptData = await receiptResponse.json()

        if (receiptData.result) {
          setVerification({
            status: 'verified',
            blockNumber: receiptData.result.blockNumber,
            blockHash: receiptData.result.blockHash,
            gasUsed: receiptData.result.gasUsed
          })
        } else {
          // Transaction exists but not yet mined
          setVerification({
            status: 'loading'
          })
        }
      } catch (error) {
        setVerification({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    verifyTransaction()

    // Set up polling for pending transactions
    const interval = setInterval(verifyTransaction, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [txHash])

  return verification
}