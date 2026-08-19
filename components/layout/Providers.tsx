'use client';

import { NavigationProvider } from './NavigationContext';
import { ApplyModal } from '../forms/ApplyModal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      {children}
      <ApplyModal />
    </NavigationProvider>
  );
}
