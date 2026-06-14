import { AppShell } from '../../../components/layout/AppShell.tsx';
import { CalendarSidebar } from '../components/CalendarSidebar.tsx';
import { CalendarGrid } from '../components/CalendarGrid.tsx';
import { ComingUpPanel } from '../components/ComingUpPanel.tsx';

export function CalendarPage() {
  return (
    <AppShell >
      {/*
        Three-column layout:
          [Left sidebar 240px] [Calendar flex-1] [Right panel 288px]
        On narrow viewports: stacks vertically.
      */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-5">
        {/* Left sidebar */}
        <div className="order-2 lg:order-1 lg:w-60 lg:shrink-0">
          <CalendarSidebar />
        </div>

        {/* Center: calendar */}
        <div
          className="order-1 flex flex-col flex-1 rounded-2xl p-5 lg:order-2"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 12px rgba(74,62,78,0.08)',
          }}
        >
          <CalendarGrid />
        </div>

        {/* Right panel */}
        <div className="order-3 lg:w-72 lg:shrink-0">
          <ComingUpPanel />
        </div>
      </div>
    </AppShell>
  );
}
