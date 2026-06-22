// ============================================
// AppShell — Layout chính
// Sidebar cố định + responsive hamburger menu
// ============================================

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Đóng sidebar khi chuyển route (trên mobile/tablet)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Đóng sidebar khi resize lên desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Khoá scroll body khi sidebar mở trên mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  // Đóng sidebar khi ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Overlay khi sidebar mở trên mobile/tablet */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/35 z-[29] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen min-w-0">
        <TopBar onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
        <main className="flex-1 p-8 max-sm:p-4 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
