import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MadrassaBanner } from './MadrassaBanner';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
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
