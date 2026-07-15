import { useActionState, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type ModalTab = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  defaultTab?: ModalTab;
  onClose: () => void;
}

interface ActionState {
  error: string | null;
}

// ---- Login Form ----
function LoginForm({ onSuccess, onSwitchTab }: { onSuccess: () => void; onSwitchTab: () => void }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [state, loginAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;

      if (!username || !password) return { error: 'Vui lòng nhập đầy đủ thông tin' };

      try {
        await login(username, password);
        showToast('🎉 Đăng nhập thành công!', 'success');
        onSuccess();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Đăng nhập thất bại' };
      }
    },
    { error: null },
  );

  return (
    <form action={loginAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="modal-username">
          Tên đăng nhập
        </label>
        <input
          id="modal-username"
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
        <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor="modal-password">
          Mật khẩu
        </label>
        <input
          id="modal-password"
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
        {isPending && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>

      <div className="text-center text-sm text-on-surface-variant">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchTab}
          className="text-primary font-semibold hover:underline"
        >
          Đăng ký ngay
        </button>
      </div>
    </form>
  );
}

// ---- Register Form ----
function RegisterForm({ onSuccess, onSwitchTab }: { onSuccess: () => void; onSwitchTab: () => void }) {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [state, registerAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const username  = formData.get('username')  as string;
      const password  = formData.get('password')  as string;
      const password2 = formData.get('password2') as string;

      if (!username || !password) return { error: 'Vui lòng nhập đầy đủ thông tin' };
      if (password !== password2)  return { error: 'Mật khẩu xác nhận không khớp' };
      if (password.length < 6)     return { error: 'Mật khẩu ít nhất 6 ký tự' };

      try {
        await register(username, password);
        showToast('🌸 Tạo tài khoản thành công!', 'success');
        onSuccess();
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Đăng ký thất bại' };
      }
    },
    { error: null },
  );

  return (
    <form action={registerAction} className="space-y-4">
      {[
        { name: 'username',  label: 'Tên đăng nhập',    type: 'text',     placeholder: 'Nhập tên đăng nhập...' },
        { name: 'password',  label: 'Mật khẩu',          type: 'password', placeholder: 'Tối thiểu 6 ký tự...' },
        { name: 'password2', label: 'Xác nhận mật khẩu', type: 'password', placeholder: 'Nhập lại mật khẩu...' },
      ].map(f => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-on-surface mb-1.5" htmlFor={`reg-${f.name}`}>
            {f.label}
          </label>
          <input
            id={`reg-${f.name}`}
            name={f.name}
            type={f.type}
            placeholder={f.placeholder}
            className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface
                       text-on-surface placeholder-on-surface-variant/50
                       focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                       transition-all text-sm"
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
        {isPending && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
      </button>

      <div className="text-center text-sm text-on-surface-variant">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchTab}
          className="text-primary font-semibold hover:underline"
        >
          Đăng nhập
        </button>
      </div>
    </form>
  );
}

// ---- Main Modal ----
export default function AuthModal({ isOpen, defaultTab = 'login', onClose }: AuthModalProps) {
  const [tab, setTab] = useState<ModalTab>(defaultTab);
  const navigate = useNavigate();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSuccess() {
    onClose();
    navigate('/dashboard');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={tab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl animate-fade-in-up z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Đóng"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <div className="p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🌸</div>
            <h2
              className="text-2xl font-bold text-on-surface"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {tab === 'login'
                ? 'Tiếp tục hành trình học tiếng Nhật'
                : 'Bắt đầu hành trình học tiếng Nhật miễn phí'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-surface-variant/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'login'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'register'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Đăng ký
            </button>
          </div>

          {/* Forms */}
          {tab === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchTab={() => setTab('register')}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchTab={() => setTab('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
