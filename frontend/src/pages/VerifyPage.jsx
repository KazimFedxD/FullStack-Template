import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthPageShell from '../components/AuthPageShell';
import VerificationCodeInput from '../components/VerificationCodeInput';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { apiGet } from '../utils/api';
import { confirmAccountDelete, getResponseMessage, normalizeUserPayload, requestAccountDelete, requestPasswordChange, requestPasswordReset, resendVerificationEmail } from '../utils/auth';

const CODE_LENGTH = 6;

export default function VerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { showSuccess, showError, showInfo } = useMessages();
  const [email, setEmail] = useState(searchParams.get('email') || user?.email || '');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const reason = searchParams.get('reason') || 'email_verification';
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

  const title = useMemo(() => {
    if (reason === 'password_reset') return 'Confirm your reset code';
    if (reason === 'password_change') return 'Confirm your change code';
    if (reason === 'account_delete') return 'Confirm account deletion';
    return 'Verify your email';
  }, [reason]);

  const subtitle = useMemo(() => {
    if (reason === 'password_reset') return 'Enter the reset code from your inbox. After that, you will be taken to the password change form.';
    if (reason === 'password_change') return 'Enter the change code from your inbox to continue to the new password form.';
    if (reason === 'account_delete') return 'Enter the deletion code from your inbox to confirm the account removal.';
    return 'Enter the six-digit verification code sent to your email address.';
  }, [reason]);

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

    setIsSubmitting(true);
    try {
      if (reason === 'password_reset' || reason === 'password_change') {
        showSuccess('Code captured. Continue to the password form.');
        navigate(
          `/change-password?mode=${reason === 'password_reset' ? 'reset' : 'change'}&email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&reason=${encodeURIComponent(reason)}`,
          { replace: true }
        );
        return;
      }

      if (reason === 'account_delete') {
        const response = await confirmAccountDelete({ code });
        if (!response.ok) {
          showError(response.error);
          return;
        }

        showSuccess(getResponseMessage(response.data, 'Account deleted successfully.'));
        await logout();
        navigate('/', { replace: true });
        return;
      }

      const response = await apiGet(`/api/auth/verify/?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&reason=email_verification`);
      if (!response.ok) {
        showError(response.error);
        return;
      }

      const payload = response.data || {};
      const message = getResponseMessage(payload, 'Email verified successfully.');
      const userPayload = normalizeUserPayload(payload.data?.user || payload.data || payload);
      if (userPayload) {
        setEmail(userPayload.email);
      }
      showSuccess(message);
      navigate('/login', { replace: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      let response;
      if (reason === 'password_reset') {
        response = await requestPasswordReset(email);
      } else if (reason === 'password_change') {
        response = await requestPasswordChange();
      } else if (reason === 'account_delete') {
        response = await requestAccountDelete();
      } else {
        response = await resendVerificationEmail(email);
      }

      if (!response.ok) {
        showError(response.error);
        return;
      }

      showInfo(getResponseMessage(response.data, 'A new code was sent.'));
    } catch (error) {
      showError(error);
    }
  };

  return (
    <AuthPageShell
      badge="Verification"
      title={title}
      subtitle={subtitle}
      helperTitle="How the code entry works"
      helperItems={[
        'Each box accepts one digit',
        'You can paste the entire code at once',
        'Query parameters prefill email and code when available',
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Security check</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Enter your code</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">If you followed the email link, the code may already be filled in.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="you@example.com"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Verification code</span>
            <VerificationCodeInput value={code} onChange={setCode} autoFocus />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 font-semibold text-white transition hover:from-sky-400 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Checking code...' : 'Continue'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <button type="button" onClick={handleResend} className="transition hover:text-white">Resend code</button>
          <Link className="transition hover:text-white" to={reason === 'account_delete' ? '/profile' : '/login'}>
            {reason === 'account_delete' ? 'Back to profile' : 'Back to login'}
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
