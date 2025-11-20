/**
 * @fileoverview Smart Transaction Link Component
 * Verifies transaction exists via RPC before showing explorer link
 */

'use client'

import { ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from './button'
import { useTransactionVerification } from '@/hooks/web3/use-transaction-verification'

interface TransactionLinkProps {
  txHash: string
  label?: string
  className?: string
}

export function TransactionLink({ 
  txHash, 
  label = "Ver transacción en Mezo Explorer",
  className = ""
}: TransactionLinkProps) {
  const verification = useTransactionVerification(txHash)

  const getStatusIcon = () => {
    switch (verification.status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
      case 'not_found':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusMessage = () => {
    switch (verification.status) {
      case 'loading':
        return 'Verificando transacción...'
      case 'verified':
        return `✅ Confirmada en bloque ${parseInt(verification.blockNumber || '0', 16)}`
      case 'error':
        return '❌ Error al verificar transacción'
      case 'not_found':
        return '⚠️ Transacción no encontrada en RPC'
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        asChild
        disabled={verification.status !== 'verified'}
      >
        <a
          href={`${process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://explorer.mezo.org'}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          {getStatusIcon()}
          <span>{label}</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {getStatusMessage()}
        </span>
        
        <div className="flex items-center gap-2">
          <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
            {txHash.slice(0, 8)}...{txHash.slice(-6)}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(txHash)}
            className="text-primary hover:underline"
            title="Copiar hash completo"
          >
            📋
          </button>
        </div>
      </div>

      {verification.status === 'verified' && (
        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-xs text-green-300">
            ✅ Transacción verificada en blockchain. Si el explorador muestra error, 
            el problema es de indexación del explorador, no de tu transacción.
          </p>
        </div>
      )}

      {verification.status === 'not_found' && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-300">
            ❌ Transacción no encontrada. Puede que haya fallado o sido rechazada.
          </p>
        </div>
      )}

      {verification.status === 'error' && (
        <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-300">
            ⚠️ Error verificando transacción: {verification.error}
          </p>
        </div>
      )}
    </div>
  )
}