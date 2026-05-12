// ============================================
// TopBar — Header sticky
// ============================================

import { useAuth } from '@/context/AuthContext';
import { getGreeting } from '@/lib/utils';

export default function TopBar() {
  const { user } = useAuth();
  const greeting = getGreeting();
  const name = user?.display_name ?? user?.username ?? '';
  const greetingText = name ? `${greeting}, ${name}! 🌸` : `${greeting}! 🌸`;

  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-between z-20">
      <div>
        <h1
          className="text-xl font-bold text-on-surface"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {greetingText}
        </h1>
        <p className="text-sm text-on-surface-variant">
          Hãy tiếp tục hành trình học tiếng Nhật nào
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-full bg-white border border-outline-variant flex items-center justify-center hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">notifications</span>
        </button>
      </div>
    </header>
  );
}
