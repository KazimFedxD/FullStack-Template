import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthPageShell from '../components/AuthPageShell';
import { useMessages } from '../contexts/MessageContext';
import { requestPasswordReset, getResponseMessage } from '../utils/auth';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useMessages();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get('email');
    if (prefill) {
      setEmail(prefill);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset(email);
      if (!response.ok) {
        showError(response.error);
        return;
      }

      showSuccess(getResponseMessage(response.data, 'If the account exists, we sent a password reset code.'));
      navigate(`/verify?email=${encodeURIComponent(email)}&reason=password_reset`, { replace: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      badge="Recovery"
      title="Forgot your password?"
      subtitle="Request a reset code and continue to the password change screen. The same code entry component is reused throughout the recovery flow."
      helperTitle="Recovery flow"
      helperItems={[
        'A code is sent to your email',
        'You can paste the code into the next step',
        'The password change page accepts both reset and change flows',
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Password recovery</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Request reset code</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">We will send a verification code to the email address on the account if it exists.</p>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 font-semibold text-white transition hover:from-sky-400 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Sending code...' : 'Send reset code'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <Link className="transition hover:text-white" to="/login">Back to login</Link>
          <Link className="transition hover:text-white" to="/register">Need an account?</Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
