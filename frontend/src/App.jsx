import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { arSA } from '@clerk/localizations';
import { AuthProvider } from './features/auth/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Marketing & Informational Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/public/AboutPage';
import FeaturesPage from './pages/public/FeaturesPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import PricingPage from './pages/public/PricingPage';
import FAQPage from './pages/public/FAQPage';
import ContactPage from './pages/public/ContactPage';

// Authentication Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Scholar Application Pages
import DashboardPage from './pages/DashboardPage';
import ResearchWizardPage from './pages/ResearchWizardPage';
import AccountPage from './pages/account/AccountPage';

// Admin Components & Pages
import AdminRoute from './components/common/AdminRoute';
import AdminLayout from './features/admin/layouts/AdminLayout';
import AdminDashboardPage from './features/admin/pages/DashboardPage';
import AdminUsersPage from './features/admin/pages/UsersPage';
import AdminSettingsPage from './features/admin/pages/SettingsPage';
import MaintenancePage from './pages/public/MaintenancePage';
import api from './services/api';
import { useAuth } from './features/auth/AuthContext';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const arabicLocalization = {
  ...arSA,
  socialButtonsBlockButton: 'المتابعة باستخدام Google',
  socialButtonsBlockButton__google: 'المتابعة باستخدام Google',
  socialButtonsIconButton: 'المتابعة باستخدام Google',
  socialButtonsIconButton__google: 'المتابعة باستخدام Google',
  dividerText: 'أو',
  formFieldLabel__emailAddress: 'البريد الإلكتروني',
  formFieldInputPlaceholder__emailAddress: 'أدخل بريدك الإلكتروني',
  formFieldLabel__password: 'كلمة المرور',
  formFieldInputPlaceholder__password: 'أدخل كلمة المرور',
  formFieldInputPlaceholder__password__new: 'أدخل كلمة المرور',
  formFieldInputPlaceholder__passwordCreation: 'أدخل كلمة المرور',
  formFieldInputPlaceholder__newPassword: 'أدخل كلمة المرور',
  formFieldInputPlaceholder__createPassword: 'أدخل كلمة المرور',
  signIn: {
    start: {
      title: 'تسجيل الدخول',
      subtitle: 'مرحباً بك مجدداً في مساعد البحث الأكاديمي',
      actionText: 'ليس لديك حساب؟',
      actionLink: 'إنشاء حساب',
      formFieldInputPlaceholder__password: 'أدخل كلمة المرور'
    },
    formButtonPrimary: 'تسجيل الدخول'
  },
  signUp: {
    start: {
      title: 'إنشاء حساب جديد',
      subtitle: 'انضم إلى مساعد البحث الأكاديمي وابدأ إعداد أبحاثك بسهولة',
      actionText: 'لديك حساب بالفعل؟',
      actionLink: 'تسجيل الدخول',
      formFieldInputPlaceholder__password: 'أدخل كلمة المرور',
      formFieldInputPlaceholder__newPassword: 'أدخل كلمة المرور'
    },
    formButtonPrimary: 'إنشاء حساب'
  }
};

const clerkAppearance = {
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
    logoPlacement: 'none'
  },
  variables: {
    colorPrimary: '#0F8F83',
    colorText: '#0F2747',
    colorTextSecondary: '#64748B',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#0F2747',
    borderRadius: '1rem',
    fontFamily: 'Cairo, sans-serif'
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    card: 'w-full max-w-[450px] bg-white rounded-[20px] border border-[#E5E7EB] shadow-xs p-6 sm:p-8 box-border',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    main: 'gap-3.5',
    socialButtons: 'w-full flex flex-col gap-2',
    socialButtonsBlockButton: 'w-full border border-[#E5E7EB] hover:border-[#0F8F83] hover:bg-teal-50/40 py-2.5 px-4 rounded-xl transition-all text-[#0F2747] font-cairo font-bold text-sm flex items-center justify-center gap-2.5',
    socialButtonsBlockButtonText: 'font-cairo font-bold text-sm text-[#0F2747]',
    dividerRow: 'my-3.5 flex items-center',
    dividerLine: 'bg-[#E5E7EB]',
    dividerText: 'font-cairo text-xs text-[#64748B] px-3 bg-white font-medium',
    form: 'flex flex-col gap-3',
    formFieldLabel: 'font-cairo text-xs font-bold text-[#0F2747] mb-1.5 text-right block',
    formFieldInput: 'w-full py-2.5 px-3.5 rounded-xl border border-[#E5E7EB] focus:border-[#0F8F83] focus:ring-2 focus:ring-[#0F8F83]/20 text-[#0F2747] text-sm font-tajawal text-right transition-all',
    formButtonPrimary: 'btn btn-primary bg-[#0F8F83] hover:bg-[#0d7b70] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-none w-full text-sm font-cairo cursor-pointer',
    footerAction: 'mt-4 pt-4 border-t border-[#E5E7EB] text-center font-cairo text-xs text-[#64748B]',
    footerActionText: 'text-[#64748B] font-cairo text-xs',
    footerActionLink: 'text-[#0F8F83] hover:text-[#0d7b70] font-bold font-cairo underline mr-1'
  }
};

const AppContent = () => {
  const location = useLocation();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.get('/public/settings')
      .then((res) => {
        if (isMounted && res.data?.success) {
          setSiteSettings(res.data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch public settings:', err.message));
    return () => { isMounted = false; };
  }, []);

  const isMaintenanceOn = siteSettings?.system?.maintenanceMode === true;
  const isElevated = isAdmin || isSuperAdmin || user?.role === 'editor';
  const isAdminPath = location.pathname.startsWith('/admin');
  const isExplicitMaintenancePath = location.pathname === '/maintenance';
  const isAuthPath = location.pathname.startsWith('/login') ||
                     location.pathname.startsWith('/register') ||
                     location.pathname.startsWith('/forgot-password') ||
                     location.pathname.startsWith('/reset-password') ||
                     location.pathname.startsWith('/verify-email');

  // Enforce Maintenance Page for public visitors when maintenance mode is active
  if (isMaintenanceOn && !isElevated && !isAuthPath && !isExplicitMaintenancePath) {
    return (
      <MaintenancePage
        title={siteSettings?.system?.maintenanceTitle}
        message={siteSettings?.system?.maintenanceMessage}
        websiteName={siteSettings?.websiteName}
        logo={siteSettings?.logo}
      />
    );
  }

  return (
    <div className="app-container">
      {!isAdminPath && !isExplicitMaintenancePath && <Navbar />}
      <main className={isAdminPath ? 'admin-main-content' : 'main-content'}>
        <Routes>
          {/* Public Marketing Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Authentication Routes */}
          <Route path="/login/*" element={<LoginPage />} />
          <Route path="/register/*" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected Scholar Research Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/research/new"
            element={
              <ProtectedRoute>
                <ResearchWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/research/:id"
            element={
              <ProtectedRoute>
                <ResearchWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/research/:id/step/:stepId"
            element={
              <ProtectedRoute>
                <ResearchWizardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard Routes — Exactly 3 Main Top-Level Menus */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout maintenanceActive={isMaintenanceOn}>
                  <AdminDashboardPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminLayout maintenanceActive={isMaintenanceOn}>
                  <AdminUsersPage />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminLayout maintenanceActive={isMaintenanceOn}>
                  <AdminSettingsPage />
                </AdminLayout>
              </AdminRoute>
            }
          />

          {/* Dedicated Maintenance Page Route */}
          <Route
            path="/maintenance"
            element={
              <MaintenancePage
                title={siteSettings?.system?.maintenanceTitle}
                message={siteSettings?.system?.maintenanceMessage}
                websiteName={siteSettings?.websiteName}
                logo={siteSettings?.logo}
              />
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={clerkAppearance}
      localization={arabicLocalization}
    >
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ClerkProvider>
  );
};

export default App;
