

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import ClientsPage from './pages/ClientsPage';
import FinancialsPage from './pages/FinancialsPage';
import PerformancePage from './pages/PerformancePage';
import CommunicationPage from './pages/CommunicationPage';
import AIAssistantPage from './pages/AIAssistantPage';
import SettingsPage from './pages/SettingsPage';
// import GoogleDrivePage from './pages/GoogleDrivePage'; // Removed
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CalendarPage from './pages/CalendarPage'; // New
import ArchivePage from './pages/ArchivePage';   // New
import DraftsPage from './pages/DraftsPage';     // New
import { useAppData } from './hooks/useAppData';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import BrandingSplashScreen from './components/BrandingSplashScreen';

const MainLayout: React.FC = () => {
  return (
    <div 
      className="flex flex-col h-screen bg-main-bg text-text-primary" 
    >
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/financials" element={<FinancialsPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/drafts" element={<DraftsPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/communication" element={<CommunicationPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            {/* <Route path="/drive" element={<GoogleDrivePage />} /> */} {/* Removed Drive Route */}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

const useAppVisibility = () => {
  const [appPhase, setAppPhase] = useState<'initial' | 'branding' | 'fading' | 'application'>('initial');
  const { currentUser, loading: authLoading } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    let newCalculatedPhase = appPhase;

    if (authLoading) {
      newCalculatedPhase = 'initial';
    } else if (isAuthPage) {
      newCalculatedPhase = 'application';
    } else if (currentUser) { // Authenticated and not on an auth page
      const brandingSplashShownThisSession = sessionStorage.getItem('brandingSplashShown');
      if (brandingSplashShownThisSession) {
        newCalculatedPhase = 'application'; // Branding done, go to app
      } else {
        // If not shown, and we are not already in branding/fading, start branding.
        // This handles transition from 'initial' or 'application' (e.g. after login) to 'branding'.
        // If we are already 'branding' or 'fading', this logic won't change it, letting the timer effect proceed.
        if (appPhase !== 'branding' && appPhase !== 'fading') {
          newCalculatedPhase = 'branding';
        }
      }
    } else { // Not authenticated and not on an auth page
      newCalculatedPhase = 'application'; // Shell needs to be visible for redirect by ProtectedRoute
    }
    
    if (newCalculatedPhase !== appPhase) {
      setAppPhase(newCalculatedPhase);
    }

  }, [appPhase, currentUser, authLoading, isAuthPage, location]);

  useEffect(() => {
    let brandingDisplayTimer: ReturnType<typeof setTimeout> | undefined;
    let fadeTransitionTimer: ReturnType<typeof setTimeout> | undefined;

    if (currentUser && !isAuthPage) {
      if (appPhase === 'branding') {
        brandingDisplayTimer = setTimeout(() => {
          setAppPhase('fading');
        }, 0); // Removed 2-second delay for faster entry
      } else if (appPhase === 'fading') {
        fadeTransitionTimer = setTimeout(() => {
          setAppPhase('application');
          sessionStorage.setItem('brandingSplashShown', 'true');
        }, 500);
      }
    }

    return () => {
      if (brandingDisplayTimer) clearTimeout(brandingDisplayTimer);
      if (fadeTransitionTimer) clearTimeout(fadeTransitionTimer);
    };
  }, [appPhase, currentUser, isAuthPage]);


  const showBrandingSplash = (appPhase === 'branding' || appPhase === 'fading') && currentUser && !isAuthPage;
  const appContentVisible = isAuthPage || (appPhase === 'fading' || appPhase === 'application');

  return { appPhase, showBrandingSplash, appContentVisible, isAuthPage };
};


const App: React.FC = () => {
  return <AppRouter />;
};

const AppRouter: React.FC = () => {
  const { appPhase, showBrandingSplash, appContentVisible, isAuthPage } = useAppVisibility();
  // Settings are used by BrandingSplashScreen internally, no need to pass from here or gate on settingsLoading.

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    );
  }

  return (
    <>
      {showBrandingSplash && <BrandingSplashScreen isFadingOut={appPhase === 'fading'} />}
       <div className={`transition-opacity duration-500 ease-in-out ${appContentVisible ? 'opacity-100' : 'opacity-0 pointer-events-none fixed inset-0'}`}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<MainLayout />} />
          </Route>
           <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  );
};

export default App;
