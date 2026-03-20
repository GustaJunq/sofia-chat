import { useState, useRef, useEffect } from "react";
import { ChevronDown, Key, Trash2, Menu, Download } from "lucide-react";
import { getUserPlan } from "@/lib/auth";
import { getOpenRouterKey, clearOpenRouterKey } from "@/lib/api";

const API_URL = "https://sofia-api-z8nr.onrender.com";

const models = [
  { id: "syn-v1-free", label: "syn-v1-free", requiredPlan: null },
  { id: "syn-v1-pro", label: "syn-v1-pro", requiredPlan: "paid" },
];

const PLAN_ACCESS: Record<string, string[]> = {
  "syn-v1-free": ["free", "paid"],
  "syn-v1-pro":  ["paid"],
};

interface HeaderProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  remainingMessages?: number | null;
  onLogout: () => void;
  onSidebarToggle?: () => void;
  isGuest?: boolean;
}

const Header = ({
  selectedModel,
  onModelChange,
  remainingMessages,
  onLogout,
  onSidebarToggle,
  isGuest,
}: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const [hasOrKey, setHasOrKey] = useState(!!getOpenRouterKey());
  const [showOrModal, setShowOrModal] = useState(false);
  const [orKeyInput, setOrKeyInput] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleModelClick = async (modelId: string) => {
    setCheckoutError("");
    const plan = getUserPlan();
    const allowed = PLAN_ACCESS[modelId] ?? [];

    if (allowed.includes(plan)) {
      onModelChange(modelId);
      setOpen(false);
      return;
    }

    setCheckoutLoading(true);
    try {
      const token = sessionStorage.getItem("sof_token");
      const res = await fetch(`${API_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: "paid" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setCheckoutError("Erro ao iniciar checkout. Tente novamente.");
      setCheckoutLoading(false);
    }
  };

  const handleRemoveOrKey = () => {
    clearOpenRouterKey();
    setHasOrKey(false);
    setOpen(false);
  };

  const handleSaveOrKey = () => {
    if (!orKeyInput.trim()) return;
    localStorage.setItem("sof_openrouter_key", orKeyInput.trim());
    setHasOrKey(true);
    setShowOrModal(false);
    setOrKeyInput("");
    setOpen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("sof_token");
    setOpen(false);
    onLogout();
  };

  const plan = getUserPlan();

  const getBadge = (modelId: string) => {
    if (PLAN_ACCESS[modelId]?.includes(plan)) return null;
    if (modelId === "syn-v1-pro") return "PRO";
    return null;
  };

  return (
    <>
      {/* OpenRouter key modal */}
      {showOrModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: "hsl(0 0% 0% / 0.8)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
            style={{
              background: "hsl(0 0% 6%)",
              border: "1px solid hsl(0 0% 100% / 0.06)",
            }}
          >
            <div
              className="flex items-center gap-2 font-semibold text-lg"
              style={{ color: "hsl(var(--foreground))" }}
            >
              <Key className="w-5 h-5" style={{ color: "hsl(220 60% 70%)" }} />
              Chave do OpenRouter
            </div>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Cole sua chave da API do{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "hsl(220 60% 70%)" }}
              >
                OpenRouter
              </a>
              . Ela fica salva só no seu navegador.
            </p>
            <input
              type="password"
              value={orKeyInput}
              onChange={(e) => setOrKeyInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveOrKey(); }}
              placeholder="sk-or-..."
              className="auth-input"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowOrModal(false); setOrKeyInput(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
                style={{ border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOrKey}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main header bar ── */}
      <header className="header-bar">
        {/* Top gradient fade like x.ai */}
        <div className="header-gradient" />

        <div className="header-inner">
          {/* ── Left: sidebar toggle + brand ── */}
          <div className="header-left">
            {!isGuest && onSidebarToggle && (
              <button
                onClick={onSidebarToggle}
                className="header-icon-btn"
                aria-label="Abrir histórico"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <span className="header-brand">SynastrIA</span>
          </div>

          {/* ── Center: model selector ── */}
          <div ref={ref} className="relative">
            <button onClick={() => setOpen(!open)} className="header-model-btn">
              {selectedModel}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {open && (
              <div className="header-dropdown">
                {models.map((m) => {
                  const badge = getBadge(m.id);
                  const isLoading = checkoutLoading && !PLAN_ACCESS[m.id]?.includes(plan);

                  return (
                    <button
                      key={m.id}
                      onClick={() => handleModelClick(m.id)}
                      disabled={isLoading}
                      className="header-dropdown-item"
                      style={{
                        color: selectedModel === m.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {isLoading ? "Redirecionando..." : (
                        <>
                          {m.label}
                          {badge && <span className="header-badge">{badge}</span>}
                        </>
                      )}
                    </button>
                  );
                })}

                {remainingMessages !== null && remainingMessages !== undefined && (
                  <div className="header-remaining">{remainingMessages} mensagens restantes</div>
                )}
                {checkoutError && (
                  <div className="px-4 py-2 text-xs border-t mt-1" style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--border))" }}>
                    {checkoutError}
                  </div>
                )}

                <div style={{ borderTop: "1px solid hsl(var(--border))", marginTop: "4px" }}>
                  {hasOrKey ? (
                    <button onClick={handleRemoveOrKey} className="header-logout flex items-center gap-2" style={{ color: "hsl(var(--destructive))" }}>
                      <Trash2 className="w-3 h-3" />
                      Remover chave OpenRouter
                    </button>
                  ) : (
                    <button onClick={() => { setShowOrModal(true); setOpen(false); }} className="header-logout flex items-center gap-2">
                      <Key className="w-3 h-3" />
                      Adicionar chave OpenRouter
                    </button>
                  )}
                  <button onClick={handleLogout} className="header-logout">Sair</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: actions ── */}
          <div className="header-actions">
            <a href="/synastria.apk" download="Synnastria.apk" className="header-cta-btn">
              <Download className="w-3 h-3" />
              APK
            </a>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
