import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "../components/ui/toaster";
import { Web3Provider, Web3ErrorBoundary } from "../providers/web3-provider";

export const metadata: Metadata = {
  title: 'KhipuVault | Ahorro Bitcoin con Rendimientos Reales',
  description: 'Digitalizamos Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <Web3ErrorBoundary>
          <Web3Provider theme="dark">
            {children}
            <Toaster />
          </Web3Provider>
        </Web3ErrorBoundary>
      </body>
    </html>
  );
}
