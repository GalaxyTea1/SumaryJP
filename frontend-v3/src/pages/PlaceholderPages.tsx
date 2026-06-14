// Placeholder pages — sẽ được implement dần
import { Link } from 'react-router-dom';

function ComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in-up">
      <span className="material-symbols-outlined text-6xl text-primary">{icon}</span>
      <h2 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
      <p className="text-on-surface-variant text-sm">Trang này đang được phát triển...</p>
      <Link to="/dashboard" className="text-primary hover:underline text-sm font-medium">
        ← Quay lại Dashboard
      </Link>
    </div>
  );
}

export function AdminPage()       { return <ComingSoon title="Admin"     icon="admin_panel_settings" />; }
export function MatchingGamePage() { return <ComingSoon title="Trò chơi Ghép Thẻ" icon="extension" />; }
export function NotFoundPage()    {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in-up">
      <span className="text-6xl">😵</span>
      <h2 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        404 — Không tìm thấy trang
      </h2>
      <Link to="/dashboard" className="text-primary hover:underline text-sm font-medium">
        ← Về trang chủ
      </Link>
    </div>
  );
}
