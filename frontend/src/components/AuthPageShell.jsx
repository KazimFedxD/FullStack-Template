import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthPageShell({
  badge = 'FullStack Template',
  title,
  subtitle,
  helperTitle = 'Built for real workflows',
  helperItems = [],
  children,
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_32%),linear-gradient(135deg,_#020617_0%,_#081226_48%,_#020617_100%)] px-4 py-6 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col justify-between gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-200">
            {badge}
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <Link className="transition hover:text-white" to="/login">Login</Link>
            <Link className="transition hover:text-white" to="/register">Register</Link>
            <Link className="transition hover:text-white" to="/verify">Verify</Link>
            <Link className="transition hover:text-white" to="/forgot-password">Forgot Password</Link>
            <Link className="transition hover:text-white" to="/profile">Profile</Link>
          </nav>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl shadow-blue-950/30 backdrop-blur-xl"
          >
            <div className="mb-6 inline-flex rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
              {badge}
            </div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg">{subtitle}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {helperItems.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
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
              {children}
            </div>

            <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-100">{helperTitle}</p>
              <p className="mt-3 leading-6 text-slate-300">
                Keep your account flows on the same verified path. Codes are entered one digit at a time, pasted codes auto-fill, and recovery links can pre-populate forms from query parameters.
              </p>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
