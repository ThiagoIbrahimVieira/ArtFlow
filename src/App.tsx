import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { ReferencesPage } from './pages/ReferencesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PalettesPage } from './pages/PalettesPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      {/* Outer shell ensuring mobile-first frame centering on desktop screens */}
      <div className="min-h-screen bg-[#12100E] flex flex-col items-center justify-start antialiased selection:bg-[#D9B98D]/30">
        <div className="w-full max-w-[440px] min-h-screen bg-[#191715] shadow-2xl relative overflow-x-hidden border-x border-[#272320]/60">
          <Routes>
            <Route path="/" element={<Navigate to="/signup" replace />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/references" element={<ReferencesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/palettes" element={<PalettesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
