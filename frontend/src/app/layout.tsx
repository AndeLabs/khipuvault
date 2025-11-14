import type {Metadata} from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Web3Provider, Web3ErrorBoundary } from "@/providers/web3-provider";
import { NetworkSwitcher } from "@/components/web3/network-switcher";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { SpeedInsights } from '@vercel/speed-insights/next';

// Optimized font loading with Next.js
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  preload: true,
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  weight: '700',
  display: 'swap',
  preload: true,
});

// Enable caching for 1 hour (3600 seconds)
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'KhipuVault | Ahorro Bitcoin con Rendimientos Reales',
  description: 'Digitalizamos Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'KhipuVault | Ahorro Bitcoin con Rendimientos Reales',
    description: 'Digitalizamos Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.',
    url: 'https://khipuvault.vercel.app',
    siteName: 'KhipuVault',
    images: [
      {
        url: '/icon-512.png',
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
    images: ['/icon-512.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${inter.variable} ${robotoMono.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <ReactQueryProvider>
          <Web3ErrorBoundary>
            <Web3Provider theme="dark">
              <NetworkSwitcher />
              {children}
              <Toaster />
              <SpeedInsights />
            </Web3Provider>
          </Web3ErrorBoundary>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
