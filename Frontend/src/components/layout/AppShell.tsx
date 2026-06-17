import type { ReactNode } from 'react';
import { Navbar } from './Navbar.tsx';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral)' }}>
      <Navbar />
      <main id="main-content" className="w-full pt-6 px-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
