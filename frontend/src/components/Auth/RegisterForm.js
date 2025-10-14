import { useState } from "react";
import PasswordInput from "./PasswordInput";
import { navigateWithDelay } from "../../utils/navigation";
import { APP_CONFIG } from "../../config/app";

export default function RegisterForm({ switchToLogin }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${APP_CONFIG.api.baseUrl}${APP_CONFIG.api.endpoints.register}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const json = await res.json();
      
      if (res.status === 201) {
        setMessage("✅ Registration successful! Please check your email to verify your account.");
        navigateWithDelay(`/verify?email=${encodeURIComponent(email)}&type=email_verification`, 2000, "Registration successful! Redirecting to verification...");
      } else {
        // Handle error responses
        setError(json.error || json.detail || "Registration failed");
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleRegister}>
      <h2 className="text-3xl font-bold text-white">Register</h2>
      {error && <p className="text-red-400">{error}</p>}
      {message && <p className="text-green-400">{message}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-3 rounded-xl bg-white/10 backdrop-blur-md text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
        required
      />
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
        className="w-full p-3 rounded-xl bg-pink-600 hover:bg-pink-500 transition-colors font-semibold text-white"
      >
        {loading ? "Registering..." : "Register"}
      </button>
      <p className="text-sm text-white/70">
        Already have an account?{" "}
        <button type="button" onClick={switchToLogin} className="underline hover:text-pink-300">
          Login
        </button>
      </p>
    </form>
  );
}
