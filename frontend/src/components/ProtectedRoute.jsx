import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-20 text-slate-100">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Loading</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Checking your session</h1>
          <p className="mt-3 text-slate-300">We’re verifying your authentication state before showing this page.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}
