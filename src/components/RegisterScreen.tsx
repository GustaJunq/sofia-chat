import { useState, FormEvent } from "react";
import { API_URL } from "@/lib/api";

interface RegisterScreenProps {
  onLogin: (token: string) => void;
  onSwitchToLogin: () => void;
}

const RegisterScreen = ({ onLogin, onSwitchToLogin, onSkip }: RegisterScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "A senha deve ter no mínimo 8 caracteres";
    if (!/[A-Z]/.test(pwd)) return "A senha deve ter ao menos uma letra maiúscula";
    if (!/[0-9]/.test(pwd)) return "A senha deve ter ao menos um número";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;

    const pwdError = validatePassword(password);
    if (pwdError) { setError(pwdError); return; }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 409) { setError("Este email já está em uso"); return; }
      if (!res.ok) { setError("Erro ao criar conta. Tente novamente."); return; }

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
          placeholder="Senha" autoComplete="new-password" className="auth-input" />

        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmar senha" autoComplete="new-password" className="auth-input" />

        <p className="auth-hint">Mínimo 8 caracteres, uma maiúscula e um número</p>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <button type="button" onClick={onSkip} className="auth-skip">Pular</button>

        <p className="auth-footer">
          Já tem conta?{" "}
          <button type="button" onClick={onSwitchToLogin} className="auth-footer-link">Entrar</button>
        </p>
      </form>
    </div>
  );
};

export default RegisterScreen;
