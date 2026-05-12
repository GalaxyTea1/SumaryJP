// ============================================
// Landing Page
// ============================================

import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-warning-light flex flex-col">
      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span className="text-xl font-bold text-primary" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          🌸 Learning JP
        </span>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link to="/dashboard" className="bg-primary text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors">
              Vào Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors">
                Đăng nhập
              </Link>
              <Link to="/register" className="bg-primary text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors">
                Bắt đầu miễn phí
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="text-center max-w-3xl animate-fade-in-up">
          <div className="text-6xl mb-6">🌸</div>
          <h1
            className="text-5xl font-bold text-on-surface mb-4 leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Học tiếng Nhật<br />
            <span className="text-primary">hiệu quả & vui vẻ</span>
          </h1>
          <p className="text-lg text-on-surface-variant mb-8 max-w-xl mx-auto">
            Hệ thống SRS thông minh, flashcard tương tác, bài test đa dạng —
            tất cả trong một app học tiếng Nhật hiện đại.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to={isLoggedIn ? '/dashboard' : '/register'}
              className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-primary-dark transition-all hover:shadow-elevated"
            >
              {isLoggedIn ? 'Vào Dashboard →' : 'Bắt đầu ngay →'}
            </Link>
            <Link
              to="/vocabulary"
              className="border-2 border-primary text-primary px-8 py-3.5 rounded-xl font-bold text-base hover:bg-primary-50 transition-colors"
            >
              Xem từ vựng
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
