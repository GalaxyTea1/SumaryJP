// ============================================
// AppShell — Layout chính
// Sidebar cố định + main content thay đổi
// ============================================

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col">
        <TopBar />
        <main className="flex-1 p-8">
          {/* React Router sẽ render page component ở đây */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
