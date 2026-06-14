// ============================================
// TopBar — Header sticky
// Responsive: hamburger button trên mobile/tablet
// ============================================

import { useAuth } from '@/context/AuthContext';
import { getGreeting } from '@/lib/utils';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth();
  const greeting = getGreeting();
  const name = user?.display_name ?? user?.username ?? '';
  const greetingText = name ? `${greeting}, ${name}! 🌸` : `${greeting}! 🌸`;

  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between z-20 max-sm:px-4 max-sm:py-3">
      <div className="flex items-center gap-3">
        {/* Hamburger button — chỉ hiện trên tablet/mobile (< lg) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 rounded-[10px] bg-white border border-outline-variant shadow-sm flex items-center justify-center hover:bg-primary-50 hover:border-primary/30 transition-all flex-shrink-0"
          aria-label="Mở menu"
        >
          <span className="material-symbols-outlined text-xl text-on-surface-variant">menu</span>
        </button>

        <div>
          <h1
            className="text-xl font-bold text-on-surface max-sm:text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {greetingText}
          </h1>
          <p className="text-sm text-on-surface-variant max-sm:text-xs">
            Hãy tiếp tục hành trình học tiếng Nhật nào
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-full bg-white border border-outline-variant flex items-center justify-center hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">notifications</span>
        </button>
      </div>
    </header>
  );
}
