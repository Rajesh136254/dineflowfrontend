import './App.css';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AnalyticsPage from './pages/AnalyticsPage';
import CustomerPage from './pages/CustomerPage';
import KitchenPage from './pages/KitchenPage';
import IngredientsPage from './pages/IngredientsPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CustomerAuthPage from './pages/CustomerAuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import DebugInfo from './components/DebugInfo';

const RootRoute = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  let isSubdomain = false;

  // Handle localhost cases
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    isSubdomain = false;
  } else if (parts.length === 2 && parts[1] === 'localhost') {
    // Handle sub.localhost
    isSubdomain = true;
  }
  // Handle production cases (e.g. sub.domain.com)
  else if (parts.length > 2 && parts[0] !== 'www') {
    isSubdomain = true;
  }

  return isSubdomain ? <HomePage /> : <DashboardPage />;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DebugInfo />
        <Router>
          <Routes>
            {/* Admin routes - keep as they are */}
            <Route path="/" element={<RootRoute />} />
            <Route path="/homepage" element={<HomePage />} />
            <Route path="/admin.html" element={<AdminPage />} />
            <Route path="/analytics.html" element={<AnalyticsPage />} />
            <Route path="/kitchen.html" element={<KitchenPage />} />
            <Route path="/ingredients" element={<IngredientsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Customer authentication flow */}
            <Route path="/login" element={<CustomerAuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected customer route */}
            <Route
              path="/customer.html"
              element={
                <ProtectedRoute>
                  <CustomerPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App; // This line was missing