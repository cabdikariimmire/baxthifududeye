import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import Navbar from './components/common/Navbar';

// Application Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ResearchWizardPage from './pages/ResearchWizardPage';

// Admin Architecture
import AdminLayout from './features/admin/components/AdminLayout';
import AdminOverviewPage from './features/admin/pages/AdminOverviewPage';
import AdminUsersPage from './features/admin/pages/AdminUsersPage';
import AdminResearchesPage from './features/admin/pages/AdminResearchesPage';
import AdminActivityPage from './features/admin/pages/AdminActivityPage';
import AdminSettingsPage from './features/admin/pages/AdminSettingsPage';

const AppContent = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {!isAdminPath && <Navbar />}
      <main className={isAdminPath ? '' : 'main-content'}>
        <Routes>
          {/* Public & Application Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/research/new" element={<ResearchWizardPage />} />
          <Route path="/research/:id" element={<ResearchWizardPage />} />
          <Route path="/research/:id/step/:stepId" element={<ResearchWizardPage />} />

          {/* Admin Nested Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="researches" element={<AdminResearchesPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="reports" element={<AdminActivityPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
