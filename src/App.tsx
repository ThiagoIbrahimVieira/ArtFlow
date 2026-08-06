import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { ReferencesPage } from './pages/ReferencesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PalettesPage } from './pages/PalettesPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#191715] flex flex-col items-center justify-center text-[#F1E2CB]">
        <div className="w-8 h-8 border-2 border-[#D9B98D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-serif text-sm">Loading ArtFlow...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authLoading, isSubmittingAuth } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#191715] flex flex-col items-center justify-center text-[#F1E2CB]">
        <div className="w-8 h-8 border-2 border-[#D9B98D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-serif text-sm">Loading ArtFlow...</p>
      </div>
    );
  }

  if (user && !isSubmittingAuth) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Outer shell ensuring mobile-first frame centering on desktop screens */}
        <div className="min-h-screen bg-[#12100E] flex flex-col items-center justify-start antialiased selection:bg-[#D9B98D]/30">
          <div className="w-full max-w-[440px] min-h-screen bg-[#191715] shadow-2xl relative overflow-x-hidden border-x border-[#272320]/60">
            <Routes>
              <Route path="/" element={<Navigate to="/signup" replace />} />
              <Route
                path="/signup"
                element={
                  <PublicOnlyRoute>
                    <SignUpPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/references"
                element={
                  <ProtectedRoute>
                    <ReferencesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/palettes"
                element={
                  <ProtectedRoute>
                    <PalettesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
