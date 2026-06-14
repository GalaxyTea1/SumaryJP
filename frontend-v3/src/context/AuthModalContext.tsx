// ============================================
// AuthModalContext — SumaryJP V3
// Global state để mở AuthModal từ bất kỳ đâu
// ============================================

import { createContext, useContext, useState, type ReactNode } from 'react';

type ModalTab = 'login' | 'register';

interface AuthModalState {
  isOpen: boolean;
  tab: ModalTab;
}

interface AuthModalContextValue {
  modalState: AuthModalState;
  openAuthModal: (tab?: ModalTab) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<AuthModalState>({
    isOpen: false,
    tab: 'login',
  });

  function openAuthModal(tab: ModalTab = 'login') {
    setModalState({ isOpen: true, tab });
  }

  function closeAuthModal() {
    setModalState(s => ({ ...s, isOpen: false }));
  }

  return (
    <AuthModalContext value={{ modalState, openAuthModal, closeAuthModal }}>
      {children}
    </AuthModalContext>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal phải dùng trong AuthModalProvider');
  return ctx;
}
