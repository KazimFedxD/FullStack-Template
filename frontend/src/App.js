
import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/ui/Navbar";
import AuthPage from "./pages/AuthPage";
import VerifyPage from "./pages/VerifyPage";
import HomePage from "./pages/HomePage";
import Background from "./components/ui/Background";

function App() {
  const renderPage = () => {
    switch (window.location.pathname) {
      case "/auth":
      case "/account":
        return <AuthPage />;
      case "/verify":
        return <VerifyPage />;
      case "/":
        return <HomePage />;
      default:
        return <div className="p-8 text-center text-gray-500">404 - Page Not Found</div>;
    }
  };

  return (
    <AuthProvider>
      <div className="App min-h-screen bg-slate-50 relative z-0">
        <Background />
        {/* Navbar should be on top */}
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>

        {/* Main content has padding to avoid being hidden under fixed navbar */}
        <main className="pt-16 relative z-0">{renderPage()}</main>
      </div>
    </AuthProvider>
  );
}

export default App;
