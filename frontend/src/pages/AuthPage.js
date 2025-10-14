import { useState } from "react";
import { motion } from "framer-motion";
import LoginForm from "../components/Auth/LoginForm";
import RegisterForm from "../components/Auth/RegisterForm";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const toggleForm = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      <div className="relative z-10 w-full max-w-4xl h-[500px] flex rounded-3xl overflow-hidden shadow-2xl">
        {/* ================= DESKTOP LAYOUT ================= */}
        <div className="hidden md:flex w-full h-full">
          {/* Login Card */}
          <motion.div
            className={`absolute top-0 w-1/2 h-full p-10 flex flex-col justify-center backdrop-blur-md rounded-l-3xl ${
              isLogin ? "left-0 bg-black/50 z-20" : "left-0 bg-black/40 z-10"
            }`}
            animate={{ x: isLogin ? 0 : "-100%" }}
            transition={{ duration: 0.6 }}
          >
            <LoginForm switchToRegister={toggleForm} />
          </motion.div>

          {/* Register Card */}
          <motion.div
            className={`absolute top-0 w-1/2 h-full p-10 flex flex-col justify-center backdrop-blur-md rounded-r-3xl ${
              isLogin ? "left-1/2 bg-black/40 z-10" : "left-1/2 bg-black/50 z-20"
            }`}
            animate={{ x: isLogin ? "100%" : 0 }}
            transition={{ duration: 0.6 }}
          >
            <RegisterForm switchToLogin={toggleForm} />
          </motion.div>

          {/* Overlay Text */}
          <motion.div
            className="absolute top-0 left-1/2 w-1/2 h-full p-10 flex flex-col justify-center items-center text-center text-white backdrop-blur-md"
            animate={{ x: isLogin ? 0 : "-100%" }}
            transition={{ duration: 0.6 }}
          >
            {isLogin ? (
              <>
                <h1 className="text-4xl font-bold">Welcome Back!</h1>
                <p className="mt-4 mb-6 text-sm">
                  To keep connected with us please login with your personal info
                </p>
                <button
                  className="px-6 py-3 rounded-xl border border-gray-500 bg-transparent hover:bg-white/20 transition-colors"
                  onClick={toggleForm}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold">Hello, Friend!</h1>
                <p className="mt-4 mb-6 text-sm">
                  Enter your personal details and start your journey with us
                </p>
                <button
                  className="px-6 py-3 rounded-xl border border-gray-500 bg-transparent hover:bg-white/20 transition-colors"
                  onClick={toggleForm}
                >
                  Sign In
                </button>
              </>
            )}
          </motion.div>
        </div>

        {/* ================= MOBILE LAYOUT ================= */}
        <div className="md:hidden w-full h-full relative overflow-hidden">
          {/* Login Card */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full p-6 flex flex-col justify-center backdrop-blur-md bg-black/50"
            initial={{ x: 0 }}
            animate={{ x: isLogin ? 0 : "-100%" }}
            transition={{ duration: 0.6 }}
          >
            <LoginForm switchToRegister={toggleForm} />
          </motion.div>

          {/* Register Card */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full p-6 flex flex-col justify-center backdrop-blur-md bg-black/50"
            initial={{ x: "100%" }}
            animate={{ x: isLogin ? "100%" : 0 }}
            transition={{ duration: 0.6 }}
          >
            <RegisterForm switchToLogin={toggleForm} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
