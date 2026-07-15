import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';

interface NavItem {
  to:   string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',   icon: 'dashboard',    label: 'Dashboard' },
  { to: '/vocabulary',  icon: 'menu_book',    label: 'Từ Vựng' },
  { to: '/grammar',     icon: 'edit_note',    label: 'Ngữ Pháp' },
  { to: '/kanji',       icon: 'translate',    label: 'Kanji' },
  { to: '/kana',        icon: 'abc',          label: 'Kana' },
  { to: '/matching-game', icon: 'extension',  label: 'Games' },
  { to: '/test-center', icon: 'quiz',         label: 'Bài Test' },
  { to: '/flashcard',   icon: 'style',        label: 'Flashcard' },
  { to: '/srs-review',  icon: 'replay',       label: 'Ôn Tập SRS' },
  { to: '/statistics',  icon: 'bar_chart',    label: 'Thống Kê' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();

  const userName = user?.display_name ?? user?.username ?? 'Khách';
  const userInitial = userName.substring(0, 2).toUpperCase();
  const userLevel = user?.level ?? (user ? 'N5 Level' : 'Chưa đăng nhập');

  function handleLogout() {
    logout();
    onClose();
    navigate('/');
  }

  return (
    <aside
      className={`
        w-[260px] bg-white border-r border-gray-100 flex flex-col fixed h-full z-40
        transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <NavLink
          to={user ? "/dashboard" : "/"}
          className="text-lg font-bold text-primary tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          onClick={onClose}
        >
          🌸 Learning JP
        </NavLink>

        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-gray-100 transition-colors"
          aria-label="Đóng menu"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-primary-50 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="border-t border-gray-100 my-2" />
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-primary-50 hover:text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              Admin
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{userName}</div>
            <div className="text-xs text-on-surface-variant">{userLevel}</div>
          </div>
          {user ? (
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="text-on-surface-variant hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          ) : (
            <button
              onClick={() => { openAuthModal('login'); onClose(); }}
              title="Đăng nhập"
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-xl">login</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
