import './App.css';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AnalyticsPage from './pages/AnalyticsPage';
import CustomerPage from './pages/CustomerPage';
import KitchenPage from './pages/KitchenPage';
import QrCodesPage from './pages/QrCodesPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CustomerAuthPage from './pages/CustomerAuthPage';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin routes - keep as they are */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/admin.html" element={<AdminPage />} />
          <Route path="/analytics.html" element={<AnalyticsPage />} />
          <Route path="/kitchen.html" element={<KitchenPage />} />
          <Route path="/qr-codes.html" element={<QrCodesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Customer authentication flow */}
          <Route path="/signup" element={<CustomerAuthPage />} />
          <Route path="/login" element={<CustomerAuthPage />} />
          
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
  );
}

export default App;