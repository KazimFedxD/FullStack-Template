import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthPageShell from '../components/AuthPageShell';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { loginUser, getResponseMessage, normalizeUserPayload } from '../utils/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useMessages();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await loginUser({ email, password });
      if (!result.ok) {
        showError(result.error);
        return;
      }

      const response = result.data || {};
      const responseData = response.data || {};
      const message = getResponseMessage(response, 'Login successful');

      if (responseData.verification_required) {
        showInfo(message);
        navigate(`/verify?email=${encodeURIComponent(email)}&reason=email_verification`, { replace: true });
        return;
      }

      const normalizedUser = normalizeUserPayload(responseData.user || responseData || response);
      if (normalizedUser) {
        login({
          user_id: normalizedUser.id,
          user_email: normalizedUser.email,
          username: normalizedUser.username,
        });
      }

      showSuccess(message);
      navigate('/profile', { replace: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      badge="Account Access"
      title="Sign in to your workspace"
      subtitle="Use the cookie-backed authentication flow to access profile management, password tools, and the rest of the template features."
      helperTitle="What happens on sign-in"
      helperItems={[
        'Signed-in state is stored in secure httpOnly cookies',
        'Profile data is refreshed after authentication',
        'Verification reminders are sent if your email is not confirmed',
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Login</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Use the email and password you registered with.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="you@example.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="Your password"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 font-semibold text-white transition hover:from-sky-400 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <Link className="transition hover:text-white" to="/forgot-password">Forgot password?</Link>
          <Link className="transition hover:text-white" to="/register">Create an account</Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
