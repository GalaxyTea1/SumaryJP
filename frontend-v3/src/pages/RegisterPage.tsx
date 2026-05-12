// ============================================
// Register Page — React 19 useActionState
// ============================================

import { useActionState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface ActionState {
  error: string | null;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [state, registerAction, isPending] = useActionState(
    async (_prevState: ActionState, formData: FormData): Promise<ActionState> => {
      const username  = formData.get('username')  as string;
      const password  = formData.get('password')  as string;
      const password2 = formData.get('password2') as string;

      if (!username || !password) return { error: 'Vui lòng nhập đầy đủ thông tin' };
      if (password !== password2)  return { error: 'Mật khẩu xác nhận không khớp' };
      if (password.length < 6)     return { error: 'Mật khẩu ít nhất 6 ký tự' };

      try {
        await register(username, password);
        showToast('🌸 Tạo tài khoản thành công!', 'success');
        navigate('/dashboard');
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Đăng ký thất bại' };
      }
    },
    { error: null },
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-warning-light flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🌸</div>
            <h1 className="text-2xl font-bold text-on-surface" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Tạo tài khoản
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">Bắt đầu hành trình học tiếng Nhật miễn phí</p>
          </div>

          <form action={registerAction} className="space-y-4">
            {['username', 'password', 'password2'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor={field}>
                  {field === 'username' ? 'Tên đăng nhập' : field === 'password' ? 'Mật khẩu' : 'Xác nhận mật khẩu'}
                </label>
                <input
                  id={field}
                  name={field}
                  type={field === 'username' ? 'text' : 'password'}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface
                             text-on-surface focus:outline-none focus:border-primary focus:ring-2
                             focus:ring-primary/20 transition-all text-sm"
                  placeholder={field === 'username' ? 'Nhập tên đăng nhập...' : field === 'password' ? 'Tối thiểu 6 ký tự...' : 'Nhập lại mật khẩu...'}
                />
              </div>
            ))}

            {state.error && (
              <div className="bg-error-light text-error text-sm px-4 py-3 rounded-xl border border-error/20">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm
                         hover:bg-primary-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {isPending && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-on-surface-variant">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
