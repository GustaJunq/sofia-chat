import { useState, useRef, useEffect } from "react";
import { ChevronDown, Key, Trash2, Menu, Github } from "lucide-react";
import { getUserPlan } from "@/lib/auth";
import { API_URL, getToken } from "@/lib/api";

const models = [
  { id: "syn-v1-free",  label: "SOF-V1-FREE",  sublabel: "Llama 3.1 8B",  requiredPlan: null },
  { id: "syn-v1-pro",   label: "SOF-V1-PRO",   sublabel: "Qwen, Llama 70b, GPT and Kimi, I choose.", requiredPlan: "paid" },
  { id: "syn-v1-pentest", label: "SOF-V1-PENTEST", sublabel: "I will check vulnerabilities in your code.", requiredPlan: "paid" },
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
      setCheckoutError("Error starting checkout. Try again.");
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
                aria-label="Open history"
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
                      {isLoading ? "Redirecting..." : (
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
                    {tokensUsed ? `Used ${tokensUsed} of ` : ""}
                    {remainingTokens + (tokensUsed || 0)} tokens
                  </div>
                )}
                {checkoutError && (
                  <div className="px-4 py-2 text-xs border-t mt-1" style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--border))" }}>
                    {checkoutError}
                  </div>
                )}

                <div style={{ borderTop: "1px solid hsl(var(--border))", marginTop: "4px" }}>
                  {githubUsername ? (
                    <button onClick={handleDisconnectGitHub} className="header-logout flex items-center gap-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Github className="w-3 h-3" />
                      GitHub: @{githubUsername}
                    </button>
                  ) : (
                    <button onClick={handleConnectGitHub} className="header-logout flex items-center gap-2">
                      <Github className="w-3 h-3" />
                      Connect GitHub
                    </button>
                  )}
                  <button onClick={handleLogout} className="header-logout">Log out</button>
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
