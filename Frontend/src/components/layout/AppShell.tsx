import type { ReactNode } from 'react';
import { Navbar } from './Navbar.tsx';
import { ThemeSync } from './ThemeSync.tsx';
import { StickyNotesLayer } from '../../features/notes/components/StickyNotesLayer.tsx';
import { AnnouncementBanner } from '../../features/announcements/components/AnnouncementBanner.tsx';
import { MaintenanceBanner } from '../../features/settings/components/MaintenanceBanner.tsx';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral)' }}>
      <ThemeSync />
      <Navbar />
      <MaintenanceBanner />
      <AnnouncementBanner />
      <main id="main-content" className="w-full pt-6 px-6 pb-24 xl:pb-6">
        {children}
      </main>
      <StickyNotesLayer />
    </div>
  );
}
