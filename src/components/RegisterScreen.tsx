import { useState, FormEvent } from "react";
import { API_URL } from "@/lib/api";
import StarLogo from "./StarLogo";

interface RegisterScreenProps {
  onLogin: (token: string) => void;
  onSwitchToLogin: () => void;
}

const RegisterScreen = ({ onLogin, onSwitchToLogin }: RegisterScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "Password needs to have 8 characters.";
    if (!/[A-Z]/.test(pwd)) return "Password needs a capital letter.";
    if (!/[0-9]/.test(pwd)) return "Password needs to have an number.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;

    const pwdError = validatePassword(password);
    if (pwdError) { setError(pwdError); return; }

    if (password !== confirmPassword) {
      setError("Passwords are not the same :/");
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
      setError("API error, try again.");
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
        <h1 className="auth-title">Criar conta</h1>
        <p className="auth-subtitle">Comece a usar a SynastrIA agora</p>

        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" autoComplete="email" className="auth-input" />

        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" autoComplete="new-password" className="auth-input" />

        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password" autoComplete="new-password" className="auth-input" />

        <p className="auth-hint">min 8 chars · 1 maiúscula · 1 número</p>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? "Creating account…" : "Create an account"}
        </button>

        <p className="auth-footer">
          Already registered?{" "}
          <button type="button" onClick={onSwitchToLogin} className="auth-footer-link">Entrar</button>
        </p>
      </form>
    </div>
  );
};

export default RegisterScreen;
