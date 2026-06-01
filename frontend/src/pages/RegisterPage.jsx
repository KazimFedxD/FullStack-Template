import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthPageShell from '../components/AuthPageShell';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { registerUser, getResponseMessage, normalizeUserPayload } from '../utils/auth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useMessages();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerUser({ email, username, password });
      if (!result.ok) {
        showError(result.error);
        return;
      }

      const response = result.data || {};
      const responseData = response.data || {};
      const user = normalizeUserPayload(responseData.user || responseData || response);
      const message = getResponseMessage(response, 'Registration successful. Check your email for the verification code.');

      showSuccess(message);
      navigate(
        `/verify?email=${encodeURIComponent(user?.email || email)}&reason=email_verification`,
        { replace: true }
      );
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      badge="Create Account"
      title="Register your account"
      subtitle="Create a new account, verify your email, and unlock the profile and security workflows built into the template."
      helperTitle="What registration enables"
      helperItems={[
        'Email verification is required before login',
        'Profile management is available after sign-in',
        'Password reset and change flows use the same verification system',
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Get started</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Register</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Use a real email address so the verification flow can reach you.</p>
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
            <span className="text-sm font-medium text-slate-200">Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="nickname"
              required
              minLength={4}
              className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="Your username"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="At least 8 characters"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="Repeat your password"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 font-semibold text-white transition hover:from-sky-400 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <Link className="transition hover:text-white" to="/login">Already have an account?</Link>
          <Link className="transition hover:text-white" to="/forgot-password">Need password help?</Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
