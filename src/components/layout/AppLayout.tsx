import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MadrassaBanner } from './MadrassaBanner';

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <TopBar onMenuClick={() => setNavOpen(true)} />
      <div className="flex flex-1">
        <Sidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
        <main className="flex-1 overflow-x-hidden">
          <MadrassaBanner />
          <div className="mx-auto w-full max-w-4xl p-4 pb-24 md:pb-8">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
