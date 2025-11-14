'use client'

/**
 * Virtualized Transactions Table
 * Optimized for rendering thousands of transactions efficiently
 * Uses @tanstack/react-virtual for performance
 */

import { useRef, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react"
import Link from "next/link"
import { useUserTransactions, formatTransactionDate, shortenTxHash, getExplorerUrl } from "@/hooks/web3/use-user-transactions"
import { Skeleton } from "@/components/ui/skeleton"
import { useAccount } from "wagmi"

const statusConfig = {
    Confirmado: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: "text-green-500" },
    Pendiente: { icon: <Clock className="h-4 w-4 text-yellow-500" />, color: "text-yellow-500" },
    Fallido: { icon: <XCircle className="h-4 w-4 text-red-500" />, color: "text-red-500" },
}

// Memoized transaction row component
const TransactionRow = memo(function TransactionRow({
    tx,
    style,
}: {
    tx: any
    style: React.CSSProperties
}) {
    return (
        <div style={style} className="absolute top-0 left-0 w-full">
            <div className="grid grid-cols-5 gap-4 p-3 border-b border-primary/10 hover:bg-primary/10 transition-colors">
                <div className="text-sm">{formatTransactionDate(tx.timestamp)}</div>
                <div className="text-sm">{tx.type}</div>
                <div className="text-sm font-code">{tx.amount}</div>
                <div>
                    <Badge variant="outline" className={`border-0 ${statusConfig[tx.status as keyof typeof statusConfig].color}`}>
                        <div className="flex items-center gap-2">
                            {statusConfig[tx.status as keyof typeof statusConfig].icon}
                            {tx.status}
                        </div>
                    </Badge>
                </div>
                <div className="text-right">
                    <Link
                        href={getExplorerUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                    >
                        {shortenTxHash(tx.hash)} <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </div>
    )
})

export function TransactionsTableVirtual() {
    const { isConnected } = useAccount()
    const { transactions, isLoading } = useUserTransactions()
    const parentRef = useRef<HTMLDivElement>(null)

    // Only virtualize if we have more than 10 transactions
    const shouldVirtualize = transactions.length > 10

    const virtualizer = useVirtualizer({
        count: transactions.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60, // Estimated row height in pixels
        overscan: 5, // Render 5 extra items above and below viewport
        enabled: shouldVirtualize,
    })

    if (!isConnected) {
        return (
            <Card className="bg-card border-primary/20 shadow-custom">
                <CardHeader>
                    <CardTitle>Transacciones Recientes</CardTitle>
                    <CardDescription>Historial de tus movimientos en el pool.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Conecta tu wallet para ver tus transacciones</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isLoading) {
        return (
            <Card className="bg-card border-primary/20 shadow-custom">
                <CardHeader>
                    <CardTitle>Transacciones Recientes</CardTitle>
                    <CardDescription>Historial de tus movimientos en el pool.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (transactions.length === 0) {
        return (
            <Card className="bg-card border-primary/20 shadow-custom">
                <CardHeader>
                    <CardTitle>Transacciones Recientes</CardTitle>
                    <CardDescription>Historial de tus movimientos en el pool.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No tienes transacciones aún</p>
                        <p className="text-sm mt-2">Realiza tu primer depósito para comenzar</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-primary/20 shadow-custom">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Transacciones Recientes</CardTitle>
                        <CardDescription>
                            Historial de tus movimientos en el pool (últimas ~33 horas).
                            {shouldVirtualize && (
                                <span className="ml-2 text-xs text-primary">
                                    Virtualizado para mejor performance
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        {transactions.length} transacciones
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {/* Header */}
                <div className="grid grid-cols-5 gap-4 p-3 border-b border-primary/20 font-semibold text-sm text-muted-foreground">
                    <div>Fecha</div>
                    <div>Tipo</div>
                    <div>Monto</div>
                    <div>Estado</div>
                    <div className="text-right">TX Hash</div>
                </div>

                {/* Virtualized List */}
                <div
                    ref={parentRef}
                    className="overflow-auto"
                    style={{
                        height: shouldVirtualize ? '500px' : 'auto',
                        contain: 'strict',
                    }}
                >
                    <div
                        style={{
                            height: shouldVirtualize ? `${virtualizer.getTotalSize()}px` : 'auto',
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {shouldVirtualize ? (
                            // Virtualized rendering for large lists
                            virtualizer.getVirtualItems().map((virtualRow) => {
                                const tx = transactions[virtualRow.index]
                                return (
                                    <TransactionRow
                                        key={virtualRow.key}
                                        tx={tx}
                                        style={{
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    />
                                )
                            })
                        ) : (
                            // Regular rendering for small lists
                            transactions.map((tx, index) => (
                                <TransactionRow
                                    key={index}
                                    tx={tx}
                                    style={{
                                        position: 'relative',
                                        height: '60px',
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {shouldVirtualize && (
                    <div className="mt-4 text-xs text-center text-muted-foreground">
                        Scroll para ver más transacciones
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Export as default for easier importing
export default TransactionsTableVirtual
