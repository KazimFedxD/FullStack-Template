import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthPageShell from '../components/AuthPageShell';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import { getResponseMessage, requestAccountDelete, requestPasswordChange, updateProfile } from '../utils/auth';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuth();
  const { showSuccess, showError, showInfo } = useMessages();
  const [username, setUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setUsername(user?.username || '');
  }, [user?.username]);

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await updateProfile({ username });
      if (!response.ok) {
        showError(response.error);
        return;
      }

      showSuccess(getResponseMessage(response.data, 'Profile updated successfully.'));
      await checkAuth();
    } catch (error) {
      showError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChangeRequest = async () => {
    setIsRequesting(true);
    try {
      const response = await requestPasswordChange();
      if (!response.ok) {
        showError(response.error);
        return;
      }

      showInfo(getResponseMessage(response.data, 'We sent a password change code to your email.'));
      navigate(`/verify?email=${encodeURIComponent(user.email)}&reason=password_change`, { replace: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeleteRequest = async () => {
    setIsRequesting(true);
    try {
      const response = await requestAccountDelete();
      if (!response.ok) {
        showError(response.error);
        return;
      }

      showInfo(getResponseMessage(response.data, 'We sent a deletion code to your email.'));
      navigate(`/verify?email=${encodeURIComponent(user.email)}&reason=account_delete`, { replace: true });
    } catch (error) {
      showError(error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('You have been signed out.');
      navigate('/login', { replace: true });
    } catch (error) {
      showError(error);
    }
  };

  return (
    <AuthPageShell
      badge="Profile"
      title="Manage your account"
      subtitle="Update your public profile, request password change codes, and manage account deletion from one place."
      helperTitle="Account controls"
      helperItems={[
        'Profile updates are applied immediately',
        'Password changes require a verification code from email',
        'Delete requests also use the same verification flow',
      ]}
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Account overview</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Your profile</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Review your current details and choose the workflow you need next.</p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
          <div className="grid gap-3 text-sm text-slate-300">
            <p><span className="font-semibold text-white">Email:</span> {user?.email || 'Not available'}</p>
            <p><span className="font-semibold text-white">Username:</span> {user?.username || 'Not set'}</p>
            <p><span className="font-semibold text-white">Verified:</span> {user?.verified ? 'Yes' : 'No'}</p>
          </div>
        </section>

        <form className="space-y-4" onSubmit={handleProfileUpdate}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={4}
              className="w-full rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              placeholder="Your username"
            />
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 font-semibold text-white transition hover:from-sky-400 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving profile...' : 'Update profile'}
          </button>
        </form>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handlePasswordChangeRequest}
            disabled={isRequesting}
            className="rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 font-semibold text-sky-100 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRequesting ? 'Sending code...' : 'Request password change code'}
          </button>
          <button
            type="button"
            onClick={handleDeleteRequest}
            disabled={isRequesting}
            className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRequesting ? 'Sending code...' : 'Request account delete code'}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <Link className="transition hover:text-white" to="/change-password?mode=change">Open password change page</Link>
          <button type="button" onClick={handleLogout} className="transition hover:text-white">Logout</button>
        </div>
      </div>
    </AuthPageShell>
  );
}
