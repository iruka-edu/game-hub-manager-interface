import type { Metadata, Viewport } from "next";
import "@/styles/global.css";
import { QueryProvider } from "@/lib/query-client";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: {
    default: "Game Hub Manager",
    template: "%s - Game Console",
  },
  description:
    "Internal management console for educational mini-games at Iruka Education",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Game Hub Manager",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Game Hub Manager",
    "application-name": "Game Hub Manager",
    "msapplication-TileColor": "#4F46E5",
    "theme-color": "#4F46E5",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Toast Container */}
        <div
          id="toast-container"
          className="fixed bottom-4 right-4 z-50 space-y-2"
        />
      </body>
    </html>
  );
}
