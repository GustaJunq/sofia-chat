import { useState, FormEvent } from "react";

const API_URL = "https://sofia-api-z8nr.onrender.com";

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

      // Mensagem generica para nao vazar detalhes do backend
      if (!res.ok) {
        setError("Email ou senha incorretos");
        return;
      }

      const data = await res.json();
      // Armazena em sessionStorage em vez de localStorage (limpa ao fechar o browser)
      sessionStorage.setItem("sof_token", data.token);
      onLogin(data.token);
    } catch {
      setError("Erro de conexao. Tente novamente.");
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
          autoComplete="current-password"
          className="w-full input-surface rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground bg-transparent text-base outline-none"
        />

        {error && <p className="text-destructive text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground rounded-[999px] py-3 text-base font-semibold transition-opacity disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Nao tem conta?{" "}
          <button type="button" onClick={onSwitchToRegister} className="text-foreground underline">
            Criar conta
          </button>
        </p>
      </form>
    </div>
  );
};

export default LoginScreen;
