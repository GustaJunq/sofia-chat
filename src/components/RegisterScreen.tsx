import { useState, FormEvent, useEffect } from "react";
import { API_URL, registerHeaders } from "@/lib/api";
import StarLogo from "./StarLogo";
import { motion } from "framer-motion";
import { Github } from "lucide-react";

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
    if (!/[0-9]/.test(pwd)) return "Password needs to have a number.";
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
      // Usamos o proxy local do Vercel (/api/register) para injetar a chave secreta com segurança
      const res = await fetch(`/api/register`, {
        method: "POST",
        headers: registerHeaders(),
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

  useEffect(() => {
    // Tenta capturar o token da URL (vindo do redirecionamento do backend)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      sessionStorage.setItem("sof_token", tokenFromUrl);
      onLogin(tokenFromUrl);
      // Limpa a URL para o usuário não ver o token
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onLogin]);

  const handleGithubRegister = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/auth/github?state=register_request`);
      const data = await res.json();
      
      if (data.redirect_url) {
        // Redireciona diretamente na mesma janela
        window.location.href = data.redirect_url;
      } else {
        setError("Could not initialize GitHub register.");
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
          <h1 className="auth-title">Criar conta</h1>
          <p className="auth-subtitle">Comece a usar a SynastrIA agora</p>

          <div className="flex flex-col gap-3 mt-4">
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

            <div className="auth-divider">ou</div>

            <button 
              type="button" 
              onClick={handleGithubRegister}
              className="auth-github"
            >
              <Github className="w-5 h-5" />
              Register with GitHub
            </button>
          </div>

          <p className="auth-footer">
            Already registered?{" "}
            <button type="button" onClick={onSwitchToLogin} className="auth-footer-link">Entrar</button>
          </p>
        </div>
      </motion.form>
    </div>
  );
};

export default RegisterScreen;
