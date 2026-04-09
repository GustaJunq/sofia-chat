import { useState, useRef, useEffect } from "react";
import { ChevronDown, Trash2, Menu, Github, Brain, X, Loader2 } from "lucide-react";
import { getUserPlan } from "@/lib/auth";
import { API_URL, getToken, fetchMemories, deleteMemory, clearAllMemories, type MemoryEntry } from "@/lib/api";

const models = [
  { id: "syn-v1-free",  label: "SOF-V1-FREE",  sublabel: "Llama 3.1 8B",  requiredPlan: null },
  { id: "syn-v1-pro",   label: "SOF-V1-PRO",   sublabel: "Qwen, Llama 70b, GPT e Kimi, eu escolho.", requiredPlan: "paid" },
  { id: "syn-v1-pentest", label: "SOF-V1-PENTEST", sublabel: "Eu vou verificar vulnerabilidades do seu código.", requiredPlan: "paid" },
];

const PLAN_ACCESS: Record<string, string[]> = {
  "syn-v1-free":  ["free", "paid"],
  "syn-v1-pro":   ["paid"],
  "syn-v1-pentest": ["paid"],
};

interface HeaderProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  remainingTokens?: number | null;
  tokensUsed?: number | null;
  onLogout: () => void;
  onSidebarToggle?: () => void;
  isGuest?: boolean;
}

// ─── Memory Panel ──────────────────────────────────────────────────────────────

function MemoryPanel({ onClose }: { onClose: () => void }) {
  const token = getToken();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchMemories(token)
      .then(setMemories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await deleteMemory(token, id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!token || !confirm("Apagar toda a memória da SofIA? Ela vai esquecer tudo sobre você.")) return;
    setClearing(true);
    try {
      await clearAllMemories(token);
      setMemories([]);
    } catch { /* ignore */ } finally {
      setClearing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "hsl(var(--background) / 0.85)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "min(520px, calc(100vw - 32px))",
          maxHeight: "80vh",
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Brain style={{ width: 16, height: 16, color: "hsl(var(--primary))" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", letterSpacing: "0.04em" }}>
              MEMÓRIA DA SOFIA
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {memories.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearing}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 6,
                  border: "1px solid hsl(var(--destructive) / 0.4)",
                  background: "hsl(var(--destructive) / 0.08)",
                  color: "hsl(var(--destructive))",
                  fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace",
                  cursor: "pointer", letterSpacing: "0.03em",
                }}
              >
                {clearing ? <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> : <Trash2 style={{ width: 10, height: 10 }} />}
                Limpar tudo
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 6, border: "none",
                background: "transparent", cursor: "pointer",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
              <Loader2 style={{ width: 20, height: 20, color: "hsl(var(--muted-foreground))" }} className="animate-spin" />
            </div>
          ) : memories.length === 0 ? (
            <div
              style={{
                textAlign: "center", padding: "40px 20px",
                color: "hsl(var(--muted-foreground))",
                fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Brain style={{ width: 32, height: 32, margin: "0 auto 12px", opacity: 0.3 }} />
              <p>Sem memórias ainda.</p>
              <p style={{ opacity: 0.6, marginTop: 4, fontSize: "0.72rem" }}>
                A SofIA vai salvar coisas sobre você conforme vocês conversam.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {memories.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    gap: 10, padding: "10px 12px",
                    background: "hsl(var(--muted) / 0.3)",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8rem", lineHeight: 1.5, color: "hsl(var(--foreground) / 0.9)", margin: 0 }}>
                      {m.content}
                    </p>
                    {m.tags && m.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {m.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: "0.64rem", padding: "1px 6px", borderRadius: 4,
                              background: "hsl(var(--primary) / 0.1)",
                              color: "hsl(var(--primary))",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", margin: "6px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(m.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    style={{
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      width: 26, height: 26, borderRadius: 6, border: "none",
                      background: "transparent", cursor: "pointer",
                      color: "hsl(var(--muted-foreground))",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--destructive))")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
                  >
                    {deletingId === m.id
                      ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                      : <Trash2 style={{ width: 12, height: 12 }} />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid hsl(var(--border))",
            fontSize: "0.68rem",
            color: "hsl(var(--muted-foreground))",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {memories.length} {memories.length === 1 ? "memória" : "memórias"} armazenadas
        </div>
      </div>
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────

const Header = ({
  selectedModel,
  onModelChange,
  remainingTokens,
  tokensUsed,
  onLogout,
  onSidebarToggle,
  isGuest,
}: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetch(`${API_URL}/auth/github/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => { if (d.connected) setGithubUsername(d.username); })
        .catch(() => {});
    }
  }, []);

  const handleConnectGitHub = async () => {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${API_URL}/auth/github`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.redirect_url) {
      const popup = window.open(data.redirect_url, "github-oauth", "width=600,height=700");
      window.addEventListener("message", (e) => {
        if (e.data?.github_connected) {
          setGithubUsername(e.data.username);
          popup?.close();
          setOpen(false);
        }
      }, { once: true });
    }
  };

  const handleDisconnectGitHub = async () => {
    const token = getToken();
    if (!token) return;
    await fetch(`${API_URL}/auth/github/disconnect`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setGithubUsername(null);
    setOpen(false);
  };

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

  const handleLogout = () => {
    sessionStorage.removeItem("sof_token");
    setOpen(false);
    onLogout();
  };

  const plan = getUserPlan();

  const getBadge = (modelId: string) => {
    if (PLAN_ACCESS[modelId]?.includes(plan)) return null;
    return "PRO";
  };

  return (
    <>
      {memoryPanelOpen && <MemoryPanel onClose={() => setMemoryPanelOpen(false)} />}

      {/* ── Main header bar ── */}
      <header className="header-bar">
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
                          <span style={{ display: "flex", flexDirection: "column", gap: "1px", flex: 1, textAlign: "left" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem" }}>{m.label}</span>
                            <span style={{ fontSize: "0.68rem", opacity: 0.5 }}>{m.sublabel}</span>
                          </span>
                          {badge && <span className="header-badge">{badge}</span>}
                        </>
                      )}
                    </button>
                  );
                })}

                {remainingTokens !== null && remainingTokens !== undefined && (
                  <div className="header-remaining">
                    {tokensUsed ? `Usou ${tokensUsed} de ` : ""}
                    {remainingTokens + (tokensUsed || 0)} tokens
                  </div>
                )}
                {checkoutError && (
                  <div className="px-4 py-2 text-xs border-t mt-1" style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--border))" }}>
                    {checkoutError}
                  </div>
                )}

                <div style={{ borderTop: "1px solid hsl(var(--border))", marginTop: "4px" }}>
                  {!isGuest && (
                    <button
                      onClick={() => { setOpen(false); setMemoryPanelOpen(true); }}
                      className="header-logout flex items-center gap-2"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      <Brain className="w-3 h-3" />
                      Memória da SofIA
                    </button>
                  )}
                  {githubUsername ? (
                    <button onClick={handleDisconnectGitHub} className="header-logout flex items-center gap-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Github className="w-3 h-3" />
                      GitHub: @{githubUsername}
                    </button>
                  ) : (
                    <button onClick={handleConnectGitHub} className="header-logout flex items-center gap-2">
                      <Github className="w-3 h-3" />
                      Conectar GitHub
                    </button>
                  )}
                  <button onClick={handleLogout} className="header-logout">Sair</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: tokens display ── */}
          <div className="header-actions">
            {remainingTokens !== null && remainingTokens !== undefined && (
              <div className="header-tokens-display">
                <span className="header-tokens-used">{tokensUsed || 0}</span>
                <span className="header-tokens-sep">/</span>
                <span className="header-tokens-total">{remainingTokens + (tokensUsed || 0)}</span>
                <span className="header-tokens-label">tokens</span>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
