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
    icon: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
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
