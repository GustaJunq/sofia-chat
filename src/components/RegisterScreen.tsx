import { useState, FormEvent } from "react";
import { API_URL } from "@/lib/api";

interface RegisterScreenProps {
  onLogin: (token: string) => void;
  onSwitchToLogin: () => void;
  onSkip: () => void;
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

      if (res.status === 409) {
        setError("Este email já está em uso");
        return;
      }

      if (!res.ok) {
        setError("Erro ao criar conta. Tente novamente.");
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
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[100] px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[360px] flex flex-col gap-4">
        <h1 className="text-foreground text-2xl font-bold text-center mb-4">sofIA</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="w-full input-surface rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground bg-transparent text-base outline-none"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          autoComplete="new-password"
          className="w-full input-surface rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground bg-transparent text-base outline-none"
        />

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmar senha"
          autoComplete="new-password"
          className="w-full input-surface rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground bg-transparent text-base outline-none"
        />

        <p className="text-xs text-muted-foreground text-center -mt-2">
          Mínimo 8 caracteres, uma maiúscula e um número
        </p>

        {error && <p className="text-destructive text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground rounded-[999px] py-3 text-base font-semibold transition-opacity disabled:opacity-50"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-[999px] py-3 text-base font-medium text-foreground/50 hover:text-foreground transition-colors"
        >
          Pular
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <button type="button" onClick={onSwitchToLogin} className="text-foreground underline">
            Entrar
          </button>
        </p>
      </form>
    </div>
  );
};

export default RegisterScreen;
