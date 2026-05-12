// ============================================
// App.tsx — Router configuration
// React Router v7 với nested routes
// ============================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { ToastProvider } from '@/context/ToastContext';

import AppShell from '@/components/layout/AppShell';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import { VocabularyPage } from '@/pages/VocabularyPage';
import { GrammarPage } from '@/pages/GrammarPage';
import { KanjiPage } from '@/pages/KanjiPage';
import { FlashcardPage } from '@/pages/FlashcardPage';
import { SrsReviewPage } from '@/pages/SrsReviewPage';
import { TestCenterPage } from '@/pages/TestCenterPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { AdminPage, NotFoundPage } from '@/pages/PlaceholderPages';

import RegisterPage from '@/pages/RegisterPage';

export default function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/"         element={<LandingPage />} />
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* App routes — có Sidebar + TopBar */}
              <Route element={<AppShell />}>
                <Route path="/dashboard"   element={<DashboardPage />} />
                <Route path="/vocabulary"  element={<VocabularyPage />} />
                <Route path="/grammar"     element={<GrammarPage />} />
                <Route path="/kanji"       element={<KanjiPage />} />
                <Route path="/test-center" element={<TestCenterPage />} />
                <Route path="/flashcard"   element={<FlashcardPage />} />
                <Route path="/srs-review"  element={<SrsReviewPage />} />
                <Route path="/statistics"  element={<StatisticsPage />} />
                <Route path="/admin"       element={<AdminPage />} />
              </Route>

              {/* Fallback */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*"    element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </GamificationProvider>
    </AuthProvider>
  );
}
