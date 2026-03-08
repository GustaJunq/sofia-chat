import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { getUserPlan } from "@/lib/auth";

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
    <div className="header-bar">
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
              <button onClick={handleLogout} className="header-logout">Sair</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
