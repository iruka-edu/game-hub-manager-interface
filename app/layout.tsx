import type { Metadata, Viewport } from 'next';
import '@/src/styles/global.css';

export const metadata: Metadata = {
  title: {
    default: 'Game Hub Manager',
    template: '%s - Game Console',
  },
  description: 'Internal management console for educational mini-games at Iruka Education',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased">
        {children}
        {/* Toast Container */}
        <div id="toast-container" className="fixed bottom-4 right-4 z-50 space-y-2" />
      </body>
    </html>
  );
}
