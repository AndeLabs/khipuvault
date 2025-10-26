import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Web3Provider, Web3ErrorBoundary } from "@/providers/web3-provider";
import { NetworkSwitcher } from "@/components/web3/network-switcher";

export const revalidate = 0

export const metadata: Metadata = {
  title: 'KhipuVault | Ahorro Bitcoin con Rendimientos Reales',
  description: 'Digitalizamos Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.',
  icons: {
    icon: '/favicon.ico',
    apple: '/logos/khipu-logo.png',
  },
  openGraph: {
    title: 'KhipuVault | Ahorro Bitcoin con Rendimientos Reales',
    description: 'Digitalizamos Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.',
    url: 'https://khipuvault.vercel.app',
    siteName: 'KhipuVault',
    images: [
      {
        url: '/logos/khipu-logo.png',
        width: 512,
        height: 512,
        alt: 'KhipuVault Logo',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KhipuVault | Ahorro Bitcoin con Rendimientos Reales',
    description: 'Digitalizamos Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.',
    images: ['/logos/khipu-logo.png'],
  },
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
            <NetworkSwitcher />
            {children}
            <Toaster />
          </Web3Provider>
        </Web3ErrorBoundary>
      </body>
    </html>
  );
}
