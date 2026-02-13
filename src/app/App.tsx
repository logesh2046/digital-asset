import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { HomePage } from './pages/HomePage';
import { UploadPage } from './pages/UploadPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { SharedAssetPage } from './pages/SharedAssetPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Shared Public Route */}
            <Route path="/share/:token" element={<SharedAssetPage />} />

            {/* Protected Dashboard Routes */}
            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="home" element={<HomePage />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="admin" element={<AdminDashboard />} />
            </Route>

          </Routes>
          <Toaster position="top-right" richColors />
        </div>
      </Router>
    </AuthProvider>
  );
}
