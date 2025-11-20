'use client'

import { useEffect, useState } from 'react'
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi'
import { mezoTestnet } from '@/lib/web3/chains'
import { useToast } from '@/hooks/use-toast'

/**
 * NetworkSwitcher Component
 * 
 * Automatically switches to Mezo Testnet when user connects with wrong network
 * Also adds Mezo Testnet to wallet if it doesn't exist
 */
export function NetworkSwitcher() {
  const { chain, isConnected, connector } = useAccount()
  const { switchChain } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const { toast } = useToast()
  const [hasAttempted, setHasAttempted] = useState(false)

  useEffect(() => {
    // Only run once when connected and on wrong network
    if (!isConnected || !chain || hasAttempted) return
    
    const isCorrectNetwork = chain.id === mezoTestnet.id
    
    if (!isCorrectNetwork) {
      console.log(`🔄 Wrong network: ${chain.name} (${chain.id})`)
      console.log(`🔄 Switching to Mezo Testnet (${mezoTestnet.id})...`)
      
      setHasAttempted(true)
      
      // First try to switch
      switchChain(
        { chainId: mezoTestnet.id },
        {
          onError: async (error) => {
            console.log('Switch failed, trying to add network:', error)
            
            // If switch fails, try to add the network
            try {
              if (walletClient) {
                await walletClient.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: `0x${mezoTestnet.id.toString(16)}`,
                      chainName: mezoTestnet.name,
                      nativeCurrency: {
                        name: mezoTestnet.nativeCurrency.name,
                        symbol: mezoTestnet.nativeCurrency.symbol,
                        decimals: mezoTestnet.nativeCurrency.decimals,
                      },
                      rpcUrls: mezoTestnet.rpcUrls.default.http,
                      blockExplorerUrls: [mezoTestnet.blockExplorers.default.url],
                    },
                  ],
                })
                
                toast({
                  title: "Red agregada",
                  description: "Mezo Testnet agregado a tu wallet",
                })
              }
            } catch (addError) {
              console.error('Failed to add network:', addError)
              
              toast({
                title: "Acción requerida",
                description: "Por favor cambia a Mezo Testnet manualmente en tu wallet",
                variant: "destructive",
              })
            }
          },
          onSuccess: () => {
            toast({
              title: "Red cambiada",
              description: "Conectado a Mezo Testnet",
            })
          }
        }
      )
    }
  }, [chain, isConnected, switchChain, walletClient, toast, hasAttempted])

  // Reset when disconnected
  useEffect(() => {
    if (!isConnected) {
      setHasAttempted(false)
    }
  }, [isConnected])

  return null
}
