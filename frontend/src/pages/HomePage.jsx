import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Shield, Sparkles, UserRound, Mail, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const highlights = [
  {
    icon: CheckCircle2,
    title: 'Verified account flows',
    description: 'Register, verify, reset passwords, change passwords, and delete accounts using the same backend workflow.',
  },
  {
    icon: Shield,
    title: 'Cookie-backed auth',
    description: 'Session cookies and token refresh keep the app signed in while the UI stays responsive.',
  },
  {
    icon: Sparkles,
    title: 'Global feedback layer',
    description: 'Every success and error is surfaced as a readable message so users always know what happened.',
  },
];

const routes = [
  { to: '/register', label: 'Create account', icon: UserRound },
  { to: '/login', label: 'Sign in', icon: KeyRound },
  { to: '/forgot-password', label: 'Reset password', icon: Mail },
];

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
      <div className="mb-4 inline-flex rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-sky-100">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.22),_transparent_30%),linear-gradient(145deg,_#020617_0%,_#07111f_48%,_#020617_100%)] px-4 py-6 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-200">
            FullStack Template
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <Link className="transition hover:text-white" to="/login">Login</Link>
            <Link className="transition hover:text-white" to="/register">Register</Link>
            <Link className="transition hover:text-white" to="/verify">Verify</Link>
            <Link className="transition hover:text-white" to="/profile">Profile</Link>
          </nav>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl md:p-10"
          >
            <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-100">
              Production-minded starter
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Authentication, recovery, and profile management in one clean template.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              This template demonstrates the full account lifecycle with a modern UI: sign up, verify by email, reset or change passwords, update your profile, and manage deletion through the same verification pattern.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {routes.map((route) => {
                const Icon = route.icon;
                return (
                  <Link
                    key={route.to}
                    to={route.to}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/30 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-sky-400/30 hover:bg-sky-400/10"
                  >
                    <Icon className="h-4 w-4" />
                    {route.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <FeatureCard key={item.title} {...item} />
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur-xl"
          >
            <div className="rounded-[1.6rem] border border-white/10 bg-slate-900/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">Session status</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">{isLoading ? 'Checking auth...' : isAuthenticated ? 'You are signed in' : 'You are signed out'}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {isAuthenticated
                  ? 'Use the profile page to update your account, request a password change code, or start account deletion.'
                  : 'Choose a route below to continue into the account workflow.'}
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                {isAuthenticated ? (
                  <>
                    <p><span className="font-semibold text-white">Email:</span> {user?.email || 'Not available'}</p>
                    <p className="mt-1"><span className="font-semibold text-white">Username:</span> {user?.username || 'Not set'}</p>
                    <p className="mt-1"><span className="font-semibold text-white">Verified:</span> {user?.verified ? 'Yes' : 'No'}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-white">Available routes</p>
                    <p className="mt-1">Login, register, verify, forgot password, change password, and profile.</p>
                  </>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-sky-400 hover:to-emerald-400"
                    >
                      Open profile
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-sky-400 hover:to-emerald-400"
                    >
                      Start now
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                    >
                      Create account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
