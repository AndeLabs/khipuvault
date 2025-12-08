import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/layout/client-layout";
import { ErrorBoundary } from "@/components/error-boundary";

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
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log to error reporting service in production
            console.error("Application Error:", error, errorInfo);
          }}
        >
          <ClientLayout>{children}</ClientLayout>
        </ErrorBoundary>
      </body>
    </html>
  );
}
