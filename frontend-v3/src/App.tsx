import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthModalProvider, useAuthModal } from '@/context/AuthModalContext';

import AppShell from '@/components/layout/AppShell';
import AuthModal from '@/components/AuthModal';
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const VocabularyPage = React.lazy(() => import('@/pages/VocabularyPage').then(m => ({ default: m.VocabularyPage })));
const GrammarPage = React.lazy(() => import('@/pages/GrammarPage').then(m => ({ default: m.GrammarPage })));
const KanjiPage = React.lazy(() => import('@/pages/KanjiPage').then(m => ({ default: m.KanjiPage })));
const FlashcardPage = React.lazy(() => import('@/pages/FlashcardPage').then(m => ({ default: m.FlashcardPage })));
const SrsReviewPage = React.lazy(() => import('@/pages/SrsReviewPage').then(m => ({ default: m.SrsReviewPage })));
const TestCenterPage = React.lazy(() => import('@/pages/TestCenterPage').then(m => ({ default: m.TestCenterPage })));
const TestTakingPage = React.lazy(() => import('@/pages/TestTakingPage'));
const TestResultPage = React.lazy(() => import('@/pages/TestResultPage'));
const StatisticsPage = React.lazy(() => import('@/pages/StatisticsPage').then(m => ({ default: m.StatisticsPage })));
const NotFoundPage = React.lazy(() => import('@/pages/PlaceholderPages').then(m => ({ default: m.NotFoundPage })));
const AdminPage = React.lazy(() => import('@/pages/AdminPage'));
const MatchingGamePage = React.lazy(() => import('@/pages/MatchingGamePage'));
const KanaPage = React.lazy(() => import('@/pages/KanaPage'));

import { useAuth } from '@/context/AuthContext';
import { FullscreenLoader } from '@/components/LoadingSpinner';

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
      <Suspense fallback={<FullscreenLoader message="Loading pages..." />}>
        <Routes>
          {/* Public routes */}
          <Route path="/"   element={<LandingPage />} />

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
      </Suspense>
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

