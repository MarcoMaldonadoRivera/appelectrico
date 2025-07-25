import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { Helmet } from 'react-helmet';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Layout Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import QuotationsPage from './pages/Quotations/QuotationsPage';
import QuotationDetailsPage from './pages/Quotations/QuotationDetailsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import ReportDetailsPage from './pages/Reports/ReportDetailsPage';
import ChatPage from './pages/Chat/ChatPage';
import VoiceRequestPage from './pages/VoiceRequest/VoiceRequestPage';
import ProfilePage from './pages/Profile/ProfilePage';
import TechniciansPage from './pages/Technicians/TechniciansPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Component
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Hooks
import { useAuth } from './hooks/useAuth';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Main App Layout Component
const AppLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is not authenticated, don't show sidebar
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Helmet>
                <title>Servicios Eléctricos Chile - Plataforma SEC</title>
                <meta 
                  name="description" 
                  content="Plataforma integral para servicios eléctricos domiciliarios en Chile con cumplimiento normativo SEC" 
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#3b82f6" />
                
                {/* Open Graph */}
                <meta property="og:title" content="Servicios Eléctricos Chile" />
                <meta property="og:description" content="Plataforma para servicios eléctricos con cumplimiento SEC" />
                <meta property="og:type" content="website" />
                
                {/* Fonts */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link 
                  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
                  rel="stylesheet" 
                />
              </Helmet>

              <AppLayout>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Protected Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />

                  {/* Quotations */}
                  <Route path="/quotations" element={
                    <ProtectedRoute>
                      <QuotationsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/quotations/:id" element={
                    <ProtectedRoute>
                      <QuotationDetailsPage />
                    </ProtectedRoute>
                  } />

                  {/* Reports */}
                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <ReportsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports/:id" element={
                    <ProtectedRoute>
                      <ReportDetailsPage />
                    </ProtectedRoute>
                  } />

                  {/* Chat */}
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  } />

                  {/* Voice Requests */}
                  <Route path="/voice-request" element={
                    <ProtectedRoute>
                      <VoiceRequestPage />
                    </ProtectedRoute>
                  } />

                  {/* Technicians (Admin/Client view) */}
                  <Route path="/technicians" element={
                    <ProtectedRoute>
                      <TechniciansPage />
                    </ProtectedRoute>
                  } />

                  {/* Profile */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />

                  {/* Redirects */}
                  <Route path="/app" element={<Navigate to="/dashboard" replace />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AppLayout>

              {/* Global Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    maxWidth: '500px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                    duration: 6000,
                  },
                  loading: {
                    iconTheme: {
                      primary: '#3b82f6',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;