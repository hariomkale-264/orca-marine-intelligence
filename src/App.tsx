import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout.tsx';
import { Home } from './pages/Home.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { SmartNavigation } from './pages/SmartNavigation.tsx';
import { EvidenceData } from './pages/EvidenceData.tsx';
import { Settings } from './pages/Settings.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { ReadAloudProvider } from './context/ReadAloudContext.tsx';

export default function App() {
  return (
    <ReadAloudProvider>
      <BrowserRouter>
        <Routes>
          {/* Entry Point: Login Page First */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ORCA Main Application (Protected behind login) */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/smart-navigation" element={<SmartNavigation />} />
            <Route path="/evidence-data" element={<EvidenceData />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ReadAloudProvider>
  );
}
