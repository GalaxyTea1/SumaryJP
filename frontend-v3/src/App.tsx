// ============================================
// App.tsx — Router configuration
// React Router v7 với nested routes
// ============================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthModalProvider, useAuthModal } from '@/context/AuthModalContext';

import AppShell from '@/components/layout/AppShell';
import AuthModal from '@/components/AuthModal';
import LandingPage from '@/pages/LandingPage';
import DashboardPage from '@/pages/DashboardPage';
import { VocabularyPage } from '@/pages/VocabularyPage';
import { GrammarPage } from '@/pages/GrammarPage';
import { KanjiPage } from '@/pages/KanjiPage';
import { FlashcardPage } from '@/pages/FlashcardPage';
import { SrsReviewPage } from '@/pages/SrsReviewPage';
import { TestCenterPage } from '@/pages/TestCenterPage';
import TestTakingPage from '@/pages/TestTakingPage';
import TestResultPage from '@/pages/TestResultPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { AdminPage, NotFoundPage } from '@/pages/PlaceholderPages';
import MatchingGamePage from '@/pages/MatchingGamePage';
import KanaPage from '@/pages/KanaPage';

import { useAuth } from '@/context/AuthContext';
import { FullscreenLoader } from '@/components/LoadingSpinner';

// AuthModal được render ở root level, nhận state từ AuthModalContext
function GlobalAuthModal() {
  const { modalState, closeAuthModal } = useAuthModal();
  return (
    <AuthModal
      isOpen={modalState.isOpen}
      defaultTab={modalState.tab}
      onClose={closeAuthModal}
    />
  );
}

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <FullscreenLoader message="Đang tải cấu hình học tập..." />;
  }

  return (
    <BrowserRouter>
      <GlobalAuthModal />
      <Routes>
        {/* Public routes */}
        <Route path="/"   element={<LandingPage />} />

        {/* App routes — có Sidebar + TopBar */}
        <Route element={<AppShell />}>
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/vocabulary"   element={<VocabularyPage />} />
          <Route path="/grammar"      element={<GrammarPage />} />
          <Route path="/kanji"        element={<KanjiPage />} />
          <Route path="/kana"         element={<KanaPage />} />
          <Route path="/matching-game" element={<MatchingGamePage />} />
          <Route path="/test-center"  element={<TestCenterPage />} />
          <Route path="/test-center/session" element={<TestTakingPage />} />
          <Route path="/test-center/result"  element={<TestResultPage />} />
          <Route path="/flashcard"    element={<FlashcardPage />} />
          <Route path="/srs-review"   element={<SrsReviewPage />} />
          <Route path="/statistics"   element={<StatisticsPage />} />
          <Route path="/admin"        element={<AdminPage />} />
        </Route>

        {/* Fallback */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*"    element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <ToastProvider>
          <AuthModalProvider>
            <AppContent />
          </AuthModalProvider>
        </ToastProvider>
      </GamificationProvider>
    </AuthProvider>
  );
}

