import { useState, FormEvent, useEffect } from "react";
import { API_URL } from "@/lib/api";
import StarLogo from "./StarLogo";
import { motion } from "framer-motion";
import { Github } from "lucide-react";

interface LoginScreenProps {
  onLogin: (token: string) => void;
  onSwitchToRegister: () => void;
}

const LoginScreen = ({ onLogin, onSwitchToRegister }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Incorrect e-mail/password.");
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("sof_token", data.token);
      onLogin(data.token);
    } catch {
      setError("API error. try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.github_auth_success && event.data.token) {
        sessionStorage.setItem("sof_token", event.data.token);
        onLogin(event.data.token);
      } else if (event.data.error) {
        setError(event.data.error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLogin]);

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/auth/github?state=login_request`);
      const data = await res.json();
      
      if (data.redirect_url) {
        // Abre em uma popup para não perder o estado da página
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          data.redirect_url,
          "GitHub Login",
          `width=${width},height=${height},left=${left},top=${top}`
        );
      } else {
        setError("Could not initialize GitHub login.");
      }
    } catch {
      setError("API error. try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <motion.form
        onSubmit={handleSubmit}
        className="auth-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="auth-card">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="hero-glow" style={{ width: 140, height: 140 }} />
              <StarLogo className="w-14 h-14 relative z-10" />
            </div>
          </div>
          <h1 className="auth-title">Hello again!</h1>
          <p className="auth-subtitle">Log in to continue</p>

          <div className="flex flex-col gap-3 mt-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email" autoComplete="email" className="auth-input" />

            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" autoComplete="current-password" className="auth-input" />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="auth-divider">ou</div>

            <button 
              type="button" 
              onClick={handleGithubLogin}
              className="auth-github"
            >
              <Github className="w-5 h-5" />
              Login with GitHub
            </button>
          </div>

          <p className="auth-footer">
            Want to create an account?{" "}
            <button type="button" onClick={onSwitchToRegister} className="auth-footer-link">Criar conta</button>
          </p>
        </div>
      </motion.form>
    </div>
  );
};

export default LoginScreen;
