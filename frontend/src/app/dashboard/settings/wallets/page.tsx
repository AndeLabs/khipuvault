
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Unplug, Eye } from "lucide-react";

export default function WalletsPage() {
    return (
        <div className="space-y-8">
            <Card className="bg-card border-primary/20 shadow-custom">
                <CardHeader>
                    <CardTitle>Wallets Conectadas</CardTitle>
                    <CardDescription>Gestiona las wallets que usas con KhipuVault.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Primary Wallet */}
                    <Card className="bg-background border-primary/50">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center gap-3">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="h-6 w-6"/>
                                    MetaMask
                                </CardTitle>
                                <Badge variant="default" className="bg-primary/80">⭐ PRINCIPAL</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground font-code p-2 bg-card rounded">
                                0x1234567890abcdef1234567890abcdef12345678
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Balance:</span>
                                <span className="font-bold font-code">0.005 BTC</span>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4"/> Actualizar</Button>
                                <Button variant="outline" size="sm"><Unplug className="mr-2 h-4 w-4"/> Desconectar</Button>
                                <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/> Ver en Explorer</Button>
                            </div>
                        </CardContent>
                    </Card>

                     {/* Bitcoin Wallet */}
                    <Card className="bg-background border-primary/20">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center gap-3">
                                     <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 6.43v-3.9a.53.53 0 00-.53-.53H8.03a.53.53 0 00-.53.53v3.9L3.71 10.2a.53.53 0 000 .7L7.5 14.57v3.9c0 .3.24.53.53.53h7.94c.3 0 .53-.24.53-.53v-3.9l3.79-3.67a.53.53 0 000-.7l-3.79-3.77zM8.56 2.56h6.88v3.23L12 9.22 8.56 5.8V2.56zM12 11.08l4.3 4.18-1.57 1.52h-5.46L7.7 15.26l4.3-4.18zM15.44 18.44H8.56v-3.23L12 11.78l3.44 3.43v3.23z" fill="#F7931A"></path></svg>
                                    Xverse
                                </CardTitle>
                                <Badge variant="secondary" className="bg-bitcoin/80 text-white">🟡 BITCOIN</Badge>
                            </div>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground font-code p-2 bg-card rounded">
                                bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Balance:</span>
                                <span className="font-bold font-code">0.003 BTC</span>
                            </div>
                             <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4"/> Actualizar</Button>
                                <Button variant="outline" size="sm"><Unplug className="mr-2 h-4 w-4"/> Desconectar</Button>
                                <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/> Ver en Explorer</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Button variant="secondary" className="w-full">➕ Conectar Otra Wallet</Button>
                </CardContent>
            </Card>

            <Card className="bg-card border-primary/20 shadow-custom">
                <CardHeader>
                    <CardTitle>Historial de Conexiones</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Wallet</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead>Dispositivo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>2024-07-25 10:30</TableCell>
                                <TableCell>MetaMask</TableCell>
                                <TableCell><Badge variant="default">Conexión</Badge></TableCell>
                                <TableCell>Chrome en Desktop</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>2024-07-24 18:00</TableCell>
                                <TableCell>Xverse</TableCell>
                                <TableCell><Badge variant="default">Conexión</Badge></TableCell>
                                <TableCell>Chrome en Desktop</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
