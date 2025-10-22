import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react"
import Link from "next/link"

const transactions = [
  { date: "2024-07-20", type: "Depósito", amount: "0.005 BTC", status: "Confirmado", txHash: "0xabc..." },
  { date: "2024-07-19", type: "Reclamo Yield", amount: "0.0001 BTC", status: "Confirmado", txHash: "0xdef..." },
  { date: "2024-07-18", type: "Retiro", amount: "0.002 BTC", status: "Pendiente", txHash: "0xghi..." },
  { date: "2024-07-17", type: "Depósito", amount: "0.01 BTC", status: "Fallido", txHash: "0xjkl..." },
  { date: "2024-07-16", type: "Depósito", amount: "0.003 BTC", status: "Confirmado", txHash: "0xmno..." },
];

const statusConfig = {
    Confirmado: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: "text-green-500" },
    Pendiente: { icon: <Clock className="h-4 w-4 text-yellow-500" />, color: "text-yellow-500" },
    Fallido: { icon: <XCircle className="h-4 w-4 text-red-500" />, color: "text-red-500" },
}

export function TransactionsTable() {
    return (
        <Card className="bg-card border-primary/20 shadow-custom">
            <CardHeader>
                <CardTitle>Transacciones Recientes</CardTitle>
                <CardDescription>Historial de tus movimientos en el pool.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-primary/20">
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">TX Hash</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((tx, index) => (
                            <TableRow key={index} className="border-primary/10 hover:bg-primary/10">
                                <TableCell>{tx.date}</TableCell>
                                <TableCell>{tx.type}</TableCell>
                                <TableCell className="font-code">{tx.amount}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`border-0 ${statusConfig[tx.status as keyof typeof statusConfig].color}`}>
                                        <div className="flex items-center gap-2">
                                            {statusConfig[tx.status as keyof typeof statusConfig].icon}
                                            {tx.status}
                                        </div>
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href="#" className="flex items-center justify-end gap-2 text-primary hover:underline">
                                        {tx.txHash} <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
