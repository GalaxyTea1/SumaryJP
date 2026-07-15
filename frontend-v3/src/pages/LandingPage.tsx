// ============================================
// Landing Page — SumaryJP V3
// Sao chép thiết kế từ V2 sang React
// ============================================

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';

const FEATURES = [
  {
    icon: 'menu_book',
    iconBg: 'bg-[#f0f7f6]',
    iconColor: 'text-primary',
    title: '2000+ Từ Vựng',
    desc: 'Giáo trình Minna No Nihongo từ N5 đến N3, được phân loại khoa học và dễ hiểu.',
  },
  {
    icon: 'edit_note',
    iconBg: 'bg-[#fff3e0]',
    iconColor: 'text-[#f0a868]',
    title: 'Ngữ Pháp Đầy Đủ',
    desc: 'Hệ thống cấu trúc ngữ pháp chi tiết kèm ví dụ giúp bạn ứng dụng ngay.',
  },
  {
    icon: 'translate',
    iconBg: 'bg-[#e8f5e9]',
    iconColor: 'text-[#4caf50]',
    title: 'Kanji Master',
    desc: 'Tra cứu Âm ON/KUN, số nét và các từ liên quan một cách trực quan nhất.',
  },
  {
    icon: 'psychology',
    iconBg: 'bg-[#f0f7f6]',
    iconColor: 'text-primary',
    title: 'SRS Thông Minh',
    desc: 'Thuật toán lặp lại ngắt quãng SM-2 giúp ghi nhớ kiến thức vào trí nhớ dài hạn.',
  },
  {
    icon: 'leaderboard',
    iconBg: 'bg-[#e3f2fd]',
    iconColor: 'text-[#42a5f5]',
    title: 'Bài Test Đa Dạng',
    desc: 'Hệ thống bài kiểm tra tổng hợp cho mọi kỹ năng, giúp tự tin trước kỳ thi JLPT.',
  },
  {
    icon: 'sports_esports',
    iconBg: 'bg-[#fce4ec]',
    iconColor: 'text-[#ef5350]',
    title: 'Gamification',
    desc: 'Streak, XP và hệ thống huy hiệu tạo động lực học tập mỗi ngày.',
  },
];

const STEPS = [
  { num: '01', title: 'Chọn Level',   desc: 'Từ N5 đến N1 phù hợp với trình độ hiện tại.' },
  { num: '02', title: 'Học Qua SRS',  desc: 'Ghi nhớ từ vựng và Kanji qua Flashcard thông minh.' },
  { num: '03', title: 'Kiểm Tra',     desc: 'Ôn tập kiến thức bằng hệ thống bài Test đa dạng.' },
  { num: '04', title: 'Xem Thống Kê', desc: 'Theo dõi tiến độ học tập qua biểu đồ trực quan.' },
];

const STATS = [
  { value: '2000+', label: 'Từ vựng',      color: 'text-primary' },
  { value: '500+',  label: 'Ngữ pháp',     color: 'text-[#f0a868]' },
  { value: '300+',  label: 'Kanji',         color: 'text-[#42a5f5]' },
  { value: '1000+', label: 'Câu hỏi test', color: 'text-[#4caf50]' },
];

export default function LandingPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { openAuthModal } = useAuthModal();

  function handleCTA() {
    if (isLoggedIn) navigate('/dashboard');
    else openAuthModal('register');
  }

  return (
    <div className="bg-[#f8fafb] text-[#1a2332] antialiased overflow-x-hidden" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex justify-between items-center w-full px-6 py-3.5 max-w-7xl mx-auto">
          <div
            className="text-xl font-bold tracking-tight text-primary"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            🌸 Learning Japanese
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Link to="/vocabulary"  className="text-primary font-semibold">Từ vựng</Link>
            <Link to="/grammar"     className="text-[#5f6b7a] hover:text-primary transition-colors">Ngữ pháp</Link>
            <Link to="/kanji"       className="text-[#5f6b7a] hover:text-primary transition-colors">Kanji</Link>
            <Link to="/test-center" className="text-[#5f6b7a] hover:text-primary transition-colors">Bài Test</Link>
          </div>
          {/* {
            isLoggedIn ? (<div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="btn-primary px-5 py-2 text-sm"
              >
                Bắt đầu nào
              </Link>
            </div>) : (<></>)
          } */}
          {/* <div >
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="btn-primary px-5 py-2 text-sm"
              >
                Bắt đầu nào
              </Link>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="btn-outline px-5 py-2 text-sm"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="btn-primary px-5 py-2 text-sm"
                >
                  Bắt đầu miễn phí
                </button>
              </>
            )}
          </div> */}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-5"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Học Tiếng Nhật<br />
              <span className="gradient-text">Thông Minh &amp; Hiệu Quả</span>
            </h1>
            <p className="text-lg text-[#5f6b7a] mb-8 max-w-lg leading-relaxed">
              Từ vựng - Ngữ pháp - Kanji - Trắc nghiệm <br />
              Tất cả trong một nền tảng học tập được tối ưu hóa.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCTA}
                className="btn-primary px-8 py-3.5 text-base text-center"
              >
                {isLoggedIn ? 'Bắt đầu nào →' : 'Bắt Đầu Miễn Phí →'}
              </button>
              <a href="#features" className="btn-outline px-8 py-3.5 text-base text-center">
                Tìm Hiểu Thêm
              </a>
            </div>

            <div className="flex items-center gap-6 mt-8 text-sm text-[#5f6b7a]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4caf50] text-lg">check_circle</span>
                Miễn phí 100%
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4caf50] text-lg">check_circle</span>
                2000+ từ vựng
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative">
            <div className="card p-3 shadow-elevated">
              <img
                src="/chibi_learning_japanese.png"
                alt="Learning Japanese Dashboard"
                className="rounded-lg w-full h-auto object-cover aspect-video"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -top-3 -right-3 card px-4 py-2.5 flex items-center gap-2 shadow-elevated">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="text-xs text-[#5f6b7a]">Daily Streak</div>
                <div className="font-bold text-[#f0a868]">15 Ngày</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2
              className="text-3xl md:text-4xl font-bold mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Mọi thứ bạn cần để chinh phục tiếng Nhật
            </h2>
            <p className="text-[#5f6b7a] text-lg">Hệ thống học tập đầy đủ từ cơ bản đến nâng cao</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-7">
                <div className={`feature-icon ${f.iconBg} mb-5`}>
                  <span className={`material-symbols-outlined ${f.iconColor} text-2xl`}>{f.icon}</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {f.title}
                </h3>
                <p className="text-[#5f6b7a] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-[#f8fafb]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-primary font-semibold text-sm tracking-wider uppercase mb-2">Lộ trình</div>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Học tập đơn giản &amp; hiệu quả
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {STEPS.map(s => (
              <div key={s.num} className="text-center">
                <div className="step-circle mx-auto mb-4">{s.num}</div>
                <h4 className="font-bold text-lg mb-2">{s.title}</h4>
                <p className="text-[#5f6b7a] text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(s => (
              <div key={s.label} className="card p-6 text-center">
                <div
                  className={`text-3xl md:text-4xl font-extrabold mb-1 ${s.color}`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {s.value}
                </div>
                <div className="text-sm text-[#5f6b7a]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
          <div>
            <div
              className="text-lg font-bold text-primary mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              🌸 Learning Japanese
            </div>
            <p className="text-[#5f6b7a] leading-relaxed">Nền tảng học tiếng Nhật hiện đại nhất cho người Việt.</p>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-[#1a2332]">Khám phá</h5>
            <ul className="space-y-2.5 text-[#5f6b7a]">
              <li><Link className="hover:text-primary transition-colors" to="/vocabulary">Từ vựng</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/grammar">Ngữ pháp</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/kanji">Kanji</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/test-center">Bài Test</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-[#1a2332]">Hỗ trợ</h5>
            <ul className="space-y-2.5 text-[#5f6b7a]">
              {['Điều khoản', 'Bảo mật', 'Liên hệ', 'FAQ'].map(t => (
                <li key={t}><a className="hover:text-primary transition-colors" href="#">{t}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-[#1a2332]">Đăng ký bản tin</h5>
            <p className="text-[#5f6b7a] mb-3">Nhận mẹo học tiếng Nhật miễn phí hàng tuần.</p>
            <div className="relative">
              <input
                className="w-full bg-[#f1f4f6] border border-gray-200 rounded-lg py-2.5 px-3.5 text-sm
                           focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Email của bạn"
                type="email"
              />
              <button className="absolute right-0 top-0 bg-primary text-white p-1.5 rounded-lg hover:bg-primary-dark transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-[#5f6b7a]">
          <div>© 2026 Learning Japanese. Đưa tiếng Nhật đến gần bạn hơn.</div>
        </div>
      </footer>


      <style>{`
        .card {
          background: #fff;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
          transition: all .3s ease;
        }
        .card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,.10), 0 2px 4px rgba(0,0,0,.06);
          transform: scale(1.01);
        }
        .btn-primary {
          background: #6caba0;
          color: #fff;
          border-radius: .75rem;
          font-weight: 600;
          transition: all .2s;
          display: inline-block;
        }
        .btn-primary:hover { background: #4d8a80; }
        .btn-outline {
          border: 2px solid #6caba0;
          color: #6caba0;
          border-radius: .75rem;
          font-weight: 600;
          transition: all .2s;
          display: inline-block;
        }
        .btn-outline:hover { background: #f0f7f6; }
        .gradient-text {
          background: linear-gradient(135deg, #6caba0 0%, #4d8a80 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .feature-icon {
          width: 56px; height: 56px;
          border-radius: .75rem;
          display: flex; align-items: center; justify-content: center;
        }
        .step-circle {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: #f0f7f6;
          border: 3px solid #6caba0;
          display: flex; align-items: center; justify-content: center;
          color: #6caba0; font-weight: 700; font-size: 1.25rem;
        }
        .shadow-elevated {
          box-shadow: 0 4px 12px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.08);
        }
      `}</style>
    </div>
  );
}
