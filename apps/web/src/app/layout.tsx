import type { Metadata } from "next";

import { Inter, Roboto_Mono } from "next/font/google";

import "./globals.css";
import { ClientLayout } from "@/components/layout/client-layout";

// Optimized font loading with next/font (auto font-display: swap, self-hosting)
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const revalidate = 0;

export const metadata: Metadata = {
  title: "KhipuVault | Ahorro Bitcoin con Rendimientos Reales",
  description:
    "Digitalizamos Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "KhipuVault | Ahorro Bitcoin con Rendimientos Reales",
    description:
      "Digitalizamos Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.",
    url: "https://khipuvault.vercel.app",
    siteName: "KhipuVault",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "KhipuVault Logo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KhipuVault | Ahorro Bitcoin con Rendimientos Reales",
    description:
      "Digitalizamos Pasanaku, Tandas y Roscas en blockchain con MUSD de Mezo.",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Note: We removed SSR hydration here because it was causing issues
  // The config with cookieStorage will handle persistence automatically
  // No need to pass initialState - cookieStorage works without it

  return (
    <html lang="es" className={`dark ${inter.variable} ${robotoMono.variable}`}>
      <body className="font-body antialiased">
        {/* Skip navigation link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Ir al contenido principal
        </a>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
