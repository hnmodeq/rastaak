import type { Metadata } from 'next';
import './globals.css';
import { NavigationProvider } from '@/components/layout/NavigationContext';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';
import { ApplyModal } from '@/components/forms/ApplyModal';
import { LoaderOverlay } from '@/components/canvas/LoaderOverlay';
import { HeroCanvasWrapper } from '@/components/canvas/HeroCanvasWrapper';

export const metadata: Metadata = {
  title: 'Vectr | The New Standard in Staffing',
  description: 'AI driven precision staffing for critical outages in high-consequence industrial environments.',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Vectr | AI Driven Precision Staffing',
    description: 'We mobilize verified industrial crews in hours, not days.',
    images: ['/share/ogp.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface-hero min-h-screen flex flex-col justify-between selection:bg-brand-primary selection:text-white">
        <NavigationProvider>
          {/* Initial Intro Loader Overlay */}
          <LoaderOverlay />

          {/* Persistent Three.js 3D WebGL Scene Background */}
          <HeroCanvasWrapper />

          {/* Site Navigation Header */}
          <Header />

          {/* Mobile Navigation Drawer */}
          <MobileNav />

          {/* Global Multi-step Apply Modal */}
          <ApplyModal />

          {/* Main Route Content */}
          <main className="relative flex-grow z-10">{children}</main>

          {/* Global Footer */}
          <Footer />
        </NavigationProvider>
      </body>
    </html>
  );
}
