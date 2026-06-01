import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyPage from './pages/VerifyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <MessageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/logout" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </MessageProvider>
  );
}

export default App;
