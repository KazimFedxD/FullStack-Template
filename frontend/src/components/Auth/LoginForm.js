import { useState } from "react";
import PasswordInput from "./PasswordInput";
import { useAuth } from "../../contexts/AuthContext";
import { saveAuthData } from "../../utils/auth";
import { navigateWithDelay } from "../../utils/navigation";
import { clearAllPreservedState } from "../../utils/statePreservation";
import { APP_CONFIG } from "../../config/app";

export default function LoginForm({ switchToRegister }) {
  const { login, checkAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${APP_CONFIG.api.baseUrl}${APP_CONFIG.api.endpoints.login}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (res.status === 200) {
        // With httpOnly cookies, we only save user info (not tokens)
        saveAuthData({ user_id: json.user_id, user_email: json.email });
        login({ user_id: json.user_id, user_email: json.email }); // Update auth context with correct field names
        clearAllPreservedState(); // Clear any old preserved state on successful login
        
        setMessage("✅ Login successful! Redirecting...");
        
        // Small delay to show success message, then redirect
        setTimeout(() => {
          window.location.href = APP_CONFIG.redirects.afterLogin;
        }, 1000);
      } else if (res.status === 201) {
        setMessage("📧 Verification required. Redirecting...");
        navigateWithDelay(`/verify?email=${encodeURIComponent(email)}&type=email_verification`, 1500, "Verification required. Redirecting...");
      } else {
        // Handle error responses (400, 401, etc.)
        setError(json.error || json.detail || "Login failed");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleLogin}>
      <h2 className="text-3xl font-bold text-white">Login</h2>
      {error && <p className="text-red-400">{error}</p>}
      {message && <p className="text-green-400">{message}</p>}
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 rounded-xl bg-white/10 backdrop-blur-md text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
        required
      />
      <PasswordInput
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-semibold text-white"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
      <p className="text-sm text-white/70">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={switchToRegister}
          className="underline hover:text-indigo-300"
        >
          Register
        </button>
      </p>
    </form>
  );
}
