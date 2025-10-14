import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { APP_CONFIG } from "../config/app";

export default function VerifyPage() {
  const [code, setCode] = useState(new Array(6).fill(""));
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const inputs = useRef([]);
  const verificationAttempted = useRef(false);

  // Read query params
  const queryParams = new URLSearchParams(window.location.search);
  const email = queryParams.get("email");
  const type = queryParams.get("type");
  const token = queryParams.get("token");

  // Format type for display only
  const formatType = (raw) => {
    if (!raw) return "";
    return raw
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  // If email missing, redirect
  useEffect(() => {
    if (!email) {
      setMessage("Missing email. Redirecting to home...");
      setMessageType("error");
      setTimeout(() => {
        window.location.href = APP_CONFIG.redirects.afterLogin;
      }, 2000);
    }
  }, [email]);

  // Function to call backend
  const handleVerify = async (finalToken) => {
    // Prevent duplicate calls
    if (isVerifying || isVerified || verificationAttempted.current) return;
    
    if (!email || !type || !finalToken) {
      setMessage("Missing data.");
      setMessageType("error");
      return;
    }

    try {
      verificationAttempted.current = true;
      setIsVerifying(true);
      setLoading(true);
      const res = await fetch(
        `${APP_CONFIG.api.baseUrl}${APP_CONFIG.api.endpoints.verify}?email=${encodeURIComponent(email)}&type=${encodeURIComponent(
          type
        )}&token=${encodeURIComponent(finalToken)}`
      );
      const json = await res.json();

      if (res.ok) {
        setIsVerified(true);
        setMessage(json.message || "Verification successful!");
        setMessageType("success");

        // redirect after 1.5s
        setTimeout(() => {
          window.location.href = APP_CONFIG.redirects.unauthorized;
        }, 1500);
      } else {
        setMessage(json.error || "Verification failed.");
        setMessageType("error");
        // Reset on failure to allow retry
        verificationAttempted.current = false;
      }
    } catch (err) {
      setMessage("Verification failed.");
      setMessageType("error");
      // Reset on failure to allow retry
      verificationAttempted.current = false;
    } finally {
      setIsVerifying(false);
      setLoading(false);
    }
  };

  // Auto-verify if token is in URL
  useEffect(() => {
    if (token && email && type && !verificationAttempted.current) {
      handleVerify(token);
    }
  }, [token, email, type]);

  // Handle input changes
  const handleChange = (e, idx) => {
    const val = e.target.value.toUpperCase();
    if (!/^[A-Z0-9]?$/.test(val)) return;

    const newCode = [...code];
    newCode[idx] = val;
    setCode(newCode);

    if (val && idx < 5) {
      inputs.current[idx + 1].focus();
    }

    // If filled all, auto submit (only if not already verifying/verified)
    const finalToken = newCode.join("");
    if (finalToken.length === 6 && !newCode.includes("") && !isVerifying && !isVerified) {
      handleVerify(finalToken);
    }
  };

  // Handle paste into any input
  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, 6).toUpperCase();
    if (!/^[A-Z0-9]+$/.test(paste)) return;

    const newCode = paste.split("").concat(new Array(6 - paste.length).fill(""));
    setCode(newCode);

    // Auto verify once pasted full code (only if not already verifying/verified)
    if (paste.length === 6 && !isVerifying && !isVerified) {
      handleVerify(paste);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      <motion.div
        className="relative z-10 flex flex-col items-center p-10 bg-black/40 backdrop-blur-md rounded-3xl space-y-6 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-white">Verify Your Account</h2>

        {email && type && (
          <div className="text-white/80 text-sm text-center space-y-1">
            <p>
              <span className="font-semibold">Email:</span> {email}
            </p>
            <p>
              <span className="font-semibold">Type:</span> {formatType(type)}
            </p>
          </div>
        )}

        {token ? (
          <p className="text-white/80 text-center">
            {isVerifying ? "Verifying your account..." : "Verifying your account automatically..."}
          </p>
        ) : (
          email && (
            <div className="flex flex-col items-center space-y-6 w-full">
              <p className="text-white/70 text-sm">
                Enter the 6-character code sent to{" "}
                <span className="font-semibold">{email}</span>
              </p>
              <div className="flex gap-3" onPaste={handlePaste}>
                {code.map((c, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    type="text"
                    maxLength="1"
                    value={c}
                    onChange={(e) => handleChange(e, i)}
                    disabled={isVerifying || isVerified}
                    className={`w-12 h-12 text-center text-xl font-bold rounded-xl bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-indigo-400 outline-none transition-all ${
                      (isVerifying || isVerified) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-white/60">
                Paste the code directly, it will auto verify.
              </p>
            </div>
          )
        )}

        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-sm text-center ${
              messageType === "success"
                ? "text-green-400"
                : messageType === "error"
                ? "text-red-400"
                : "text-white/90"
            }`}
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
