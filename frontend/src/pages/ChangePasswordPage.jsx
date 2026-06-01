import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthPageShell from '../components/AuthPageShell';
import VerificationCodeInput from '../components/VerificationCodeInput';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import {
  confirmPasswordChange,
  confirmPasswordReset,
  getResponseMessage,
  requestPasswordChange,
  requestPasswordReset,
} from '../utils/auth';

const CODE_LENGTH = 6;

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { showSuccess, showError, showInfo } = useMessages();
  const mode = searchParams.get('mode') || 'reset';
  const [email, setEmail] = useState(searchParams.get('email') || user?.email || '');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    const queryCode = searchParams.get('code');
    if (queryEmail) {
      setEmail(queryEmail);
    }
    if (queryCode) {
      setCode(queryCode.replace(/\D/g, '').slice(0, CODE_LENGTH));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!email && user?.email) {
      setEmail(user.email);
    }
  }, [email, user?.email]);

  const title = useMemo(() => (mode === 'change' ? 'Change your password' : 'Reset your password'), [mode]);
  const subtitle = useMemo(() => (
    mode === 'change'
      ? 'Use the code from your inbox to update your password while signed in.'
      : 'Use the reset code from your inbox to set a new password.'
  ), [mode]);

  const handleRequestCode = async () => {
    try {
      if (mode === 'change') {
        const response = await requestPasswordChange();
        if (!response.ok) {
          showError(response.error);
          return;
        }
        showInfo(getResponseMessage(response.data, 'We sent a password change code.'));
        return;
      }

      if (!email) {
        showError('Enter an email address first.');
        return;
      }

      const response = await requestPasswordReset(email);
      if (!response.ok) {
        showError(response.error);
        return;
      }
      showInfo(getResponseMessage(response.data, 'We sent a password reset code.'));
    } catch (error) {
      showError(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      showError('Email is required.');
      return;
    }
    if (code.length !== CODE_LENGTH) {
      showError('Enter the full six-digit code.');
      return;
    }
    if (newPassword.length < 8) {
      showError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = mode === 'change'
        ? await confirmPasswordChange({ code, new_password: newPassword, confirm_password: confirmPassword })
        : await confirmPasswordReset({ email, code, new_password: newPassword, confirm_password: confirmPassword });

      if (!response.ok) {
        showError(response.error);
        return;
      }

      const message = getResponseMessage(response.data, 'Password updated successfully.');
      showSuccess(message);
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      badge="Password Security"
      title={title}
      subtitle={subtitle}
      helperTitle="Password flow"
      helperItems={[
        'Request a verification code if you do not have one yet',
        'Paste the code into the six-digit input or type it manually',
        'Password changes revoke existing sessions on the backend',
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Account security</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Set a new password</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Choose a strong password and confirm the code from your email.</p>
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
              readOnly={mode === 'change'}
              className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40 disabled:cursor-not-allowed disabled:opacity-80"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Verification code</span>
            <VerificationCodeInput value={code} onChange={setCode} autoFocus />
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="At least 8 characters"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="Repeat the new password"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 font-semibold text-white transition hover:from-sky-400 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving password...' : 'Save password'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <button type="button" onClick={handleRequestCode} className="transition hover:text-white">Request a new code</button>
          <Link className="transition hover:text-white" to={mode === 'change' ? '/profile' : '/login'}>
            {mode === 'change' ? 'Back to profile' : 'Back to login'}
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
