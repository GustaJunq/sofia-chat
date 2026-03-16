import { useState, useRef, useEffect } from "react";
import { ChevronDown, Key, Trash2 } from "lucide-react";
import { getUserPlan } from "@/lib/auth";
import { getOpenRouterKey, clearOpenRouterKey } from "@/lib/api";

const API_URL = "https://sofia-api-z8nr.onrender.com";

const models = [
  { id: "sof-v1-free", label: "sof-v1-free", requiredPlan: null },
  { id: "sof-v1-pro", label: "sof-v1-pro", requiredPlan: "paid" },
];

const PLAN_ACCESS: Record<string, string[]> = {
  "sof-v1-free": ["free", "paid"],
  "sof-v1-pro":  ["paid"],
};

interface HeaderProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  remainingMessages?: number | null;
  onLogout: () => void;
}

const Header = ({ selectedModel, onModelChange, remainingMessages, onLogout }: HeaderProps) => {
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
    if (modelId === "sof-v1-pro") return "PRO";
    return null;
  };

  return (
    <>
    {showOrModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Key className="w-5 h-5 text-orange-400" />
            Chave do OpenRouter
          </div>
          <p className="text-white/60 text-sm">
            Cole sua chave da API do{" "}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">
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
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-orange-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowOrModal(false); setOrKeyInput(""); }}
              className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveOrKey}
              className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="header-bar">
      <a
        href="/sofia.apk"
        download="SofIA.apk"
        className="fixed top-0 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-accent transition-all duration-200 text-foreground text-sm font-medium"
        style={{ top: "max(env(safe-area-inset-top, 0px), 2rem)" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Baixar APK
      </a>

      <div ref={ref} className="relative">
        <button onClick={() => setOpen(!open)} className="header-model-btn">
          {selectedModel}
          <ChevronDown className="w-4 h-4 opacity-70" />
        </button>

        {open && (
          <div className="header-dropdown">
            {models.map((m) => {
              const badge = getBadge(m.id);
              const isLoading = checkoutLoading && !PLAN_ACCESS[m.id]?.includes(plan);

              return (
                <button key={m.id} onClick={() => handleModelClick(m.id)} disabled={isLoading}
                  className={`header-dropdown-item ${selectedModel === m.id ? "text-foreground font-semibold" : "text-foreground/50"}`}
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
              <div className="px-4 py-2 text-xs text-destructive border-t border-border mt-1">{checkoutError}</div>
            )}
            <div className="border-t border-border mt-1">
              {hasOrKey ? (
                <button
                  onClick={handleRemoveOrKey}
                  className="header-logout flex items-center gap-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover chave OpenRouter
                </button>
              ) : (
                <button
                  onClick={() => { setShowOrModal(true); setOpen(false); }}
                  className="header-logout flex items-center gap-2"
                >
                  <Key className="w-3 h-3" />
                  Adicionar chave OpenRouter
                </button>
              )}
              <button onClick={handleLogout} className="header-logout">Sair</button>
            </div>
          </div>
        )}
      </div>
    </div>
  </>
  );
};

export default Header;
