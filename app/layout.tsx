import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TranslationProvider } from '@/lib/i18n/useTranslation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tour Ops Platform',
  description: 'Tour operator operations platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TourOps',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TourOps" />
      </head>
      <body className={inter.className}>
        <TranslationProvider>
          {children}
        </TranslationProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('SW registered: ', registration.scope);
                  },
                  function(err) {
                    console.log('SW registration failed: ', err);
                  }
                );
              });
            }
          `
        }} />
      </body>
    </html>
  )
}
