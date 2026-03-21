import { useState, FormEvent } from "react";
import { API_URL } from "@/lib/api";
import StarLogo from "./StarLogo";

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

  return (
    <div className="auth-screen">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="hero-glow" style={{ width: 120, height: 120 }} />
            <StarLogo className="w-14 h-14 relative z-10" />
          </div>
        </div>
        <h1 className="auth-title">Hello again!</h1>
        <p className="auth-subtitle">Log in to continue</p>

        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" autoComplete="email" className="auth-input" />

        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" autoComplete="current-password" className="auth-input" />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="auth-footer">
          Want to create an account?{" "}
          <button type="button" onClick={onSwitchToRegister} className="auth-footer-link">Criar conta</button>
        </p>
      </form>
    </div>
  );
};

export default LoginScreen;
