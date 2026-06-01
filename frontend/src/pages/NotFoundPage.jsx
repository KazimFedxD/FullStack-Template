import { Link } from 'react-router-dom';
import AuthPageShell from '../components/AuthPageShell';

export default function NotFoundPage() {
  return (
    <AuthPageShell
      badge="404"
      title="Page not found"
      subtitle="The route you requested does not exist in this template. Use the navigation below to get back to the supported flows."
      helperTitle="Available routes"
      helperItems={[
        'Login, register, verify, forgot password, and profile pages are implemented',
        'The home page summarizes the template and links to the main flows',
      ]}
    >
      <div className="space-y-5 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Unknown route</p>
        <h2 className="text-3xl font-semibold text-white">We could not find that page</h2>
        <p className="text-sm leading-6 text-slate-300">Use one of the supported paths to continue.</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2 text-sm">
          <Link className="rounded-full border border-white/15 px-4 py-2 text-slate-200 transition hover:bg-white/10" to="/">
            Home
          </Link>
          <Link className="rounded-full border border-white/15 px-4 py-2 text-slate-200 transition hover:bg-white/10" to="/login">
            Login
          </Link>
          <Link className="rounded-full border border-white/15 px-4 py-2 text-slate-200 transition hover:bg-white/10" to="/register">
            Register
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
