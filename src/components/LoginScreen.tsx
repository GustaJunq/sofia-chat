import { useState, FormEvent } from "react";
import { API_URL } from "@/lib/api";

interface LoginScreenProps {
  onLogin: (token: string) => void;
  onSwitchToRegister: () => void;
  onSkip: () => void;
}

const LoginScreen = ({ onLogin, onSwitchToRegister, onSkip }: LoginScreenProps) => {
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
        setError("Email ou senha incorretos");
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("sof_token", data.token);
      onLogin(data.token);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1 className="auth-title">sofIA</h1>

        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" autoComplete="email" className="auth-input" />

        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha" autoComplete="current-password" className="auth-input" />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <button type="button" onClick={onSkip} className="auth-skip">Pular</button>

        <p className="auth-footer">
          Não tem conta?{" "}
          <button type="button" onClick={onSwitchToRegister} className="auth-footer-link">Criar conta</button>
        </p>
      </form>
    </div>
  );
};

export default LoginScreen;
