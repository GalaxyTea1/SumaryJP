// Placeholder pages — sẽ được implement dần
import { Link } from 'react-router-dom';


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
