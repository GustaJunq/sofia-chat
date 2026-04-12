import { useState, FormEvent } from "react";
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

  const handleGithubLogin = () => {
    // Redireciona para o fluxo OAuth do GitHub no backend
    // Como o usuário ainda não está logado, passamos um state vazio ou um marcador
    const params = `client_id=Ov23lizV88Z7K77Y296R&scope=repo,read:user&state=login_request`;
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
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
