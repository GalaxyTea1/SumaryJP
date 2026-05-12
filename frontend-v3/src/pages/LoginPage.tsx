// ============================================
// Login Page — React 19 useActionState
// ✨ Thay thế onSubmit truyền thống
// ============================================

import { useActionState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface ActionState {
  error: string | null;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // ✨ React 19 — useActionState
  // action fn nhận (prevState, formData) — không cần useState riêng cho loading
  const [state, loginAction, isPending] = useActionState(
    async (_prevState: ActionState, formData: FormData): Promise<ActionState> => {
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;

      if (!username || !password) {
        return { error: 'Vui lòng nhập đầy đủ thông tin' };
      }

      try {
        await login(username, password);
        showToast('🎉 Đăng nhập thành công!', 'success');
        navigate('/dashboard');
        return { error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại';
        return { error: msg };
      }
    },
    { error: null },
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-warning-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 animate-fade-in-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🌸</div>
            <h1 className="text-2xl font-bold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Đăng nhập
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">Tiếp tục hành trình học tiếng Nhật</p>
          </div>

          {/* ✨ React 19: <form action={loginAction}> — không cần onSubmit */}
          <form action={loginAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="username">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface
                           text-on-surface placeholder-on-surface-variant/50
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           transition-all text-sm"
                placeholder="Nhập tên đăng nhập..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="password">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface
                           text-on-surface placeholder-on-surface-variant/50
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           transition-all text-sm"
                placeholder="Nhập mật khẩu..."
              />
            </div>

            {/* Error message */}
            {state.error && (
              <div className="bg-error-light text-error text-sm px-4 py-3 rounded-xl border border-error/20">
                {state.error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm
                         hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {isPending && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-on-surface-variant">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
