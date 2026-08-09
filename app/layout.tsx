import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Loader } from '@/components/layout/Loader';
import { ClientScripts } from '@/components/layout/ClientScripts';

export const metadata: Metadata = {
  title: 'Rastaak | The New Standard in Staffing',
  description: 'AI driven precision staffing for critical outages in high-consequence environments.',
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/icons/site.webmanifest',
  openGraph: {
    title: 'Rastaak | AI Driven Precision Staffing',
    description: 'We mobilize verified industrial crews to protect your schedule and your bottom line.',
    images: ['/share/ogp.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US" className="preload">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/favicon-96x96.png" />
        <link rel="manifest" href="/icons/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: '#D0E1EB', overflow: 'hidden' }}>
        <div className="transition-pages" />
        <div className="mobile-nav__overlay" />

        {/* Site Header */}
        <Header />

        {/* Dynamic Route View */}
        <main data-taxi>{children}</main>

        {/* Site Footer */}
        <Footer />

        {/* Introductory SVG Loader */}
        <Loader />

        {/* Client Initialization Scripts (3D Three.js, Draco, Shaders, SPA Taxi routing) */}
        <ClientScripts />
      </body>
    </html>
  );
}
