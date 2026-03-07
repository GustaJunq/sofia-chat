import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { getUserPlan } from "@/lib/auth";

const API_URL = "https://sofia-api-z8nr.onrender.com";

const models = [
  { id: "sof-v1-free", label: "sof-v1-free", requiredPlan: null },
  { id: "sof-v1-reasoning", label: "sof-v1-reasoning", requiredPlan: "reasoning" },
  { id: "sof-v1-pro", label: "sof-v1-pro", requiredPlan: "paid" },
];

// Planos que têm acesso a cada modelo
const PLAN_ACCESS: Record<string, string[]> = {
  "sof-v1-free":      ["free", "reasoning", "paid"],
  "sof-v1-reasoning": ["reasoning", "paid"],
  "sof-v1-pro":       ["paid"],
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

    // Usuário já tem acesso → só troca o modelo
    if (allowed.includes(plan)) {
      onModelChange(modelId);
      setOpen(false);
      return;
    }

    // Sem acesso → inicia checkout com o plano correto
    const targetPlan = modelId === "sof-v1-reasoning" ? "reasoning" : "paid";
    setCheckoutLoading(true);
    try {
      const token = sessionStorage.getItem("sof_token");
      const res = await fetch(`${API_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: targetPlan }),
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

  // Badge exibido ao lado de modelos bloqueados
  const getBadge = (modelId: string) => {
    if (PLAN_ACCESS[modelId]?.includes(plan)) return null;
    if (modelId === "sof-v1-reasoning") return "REASONING";
    if (modelId === "sof-v1-pro") return "PRO";
    return null;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-12">
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-foreground font-bold text-lg tracking-tight"
        >
          {selectedModel}
          <ChevronDown className="w-4 h-4 opacity-70" />
        </button>

        {open && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-popover rounded-2xl py-2 min-w-[200px] border border-border">
            {models.map((m) => {
              const badge = getBadge(m.id);
              const isLoading = checkoutLoading && !PLAN_ACCESS[m.id]?.includes(plan);

              return (
                <button
                  key={m.id}
                  onClick={() => handleModelClick(m.id)}
                  disabled={isLoading}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent flex items-center gap-2 disabled:opacity-50 ${
                    selectedModel === m.id ? "text-foreground font-semibold" : "text-foreground/50"
                  }`}
                >
                  {isLoading ? (
                    "Redirecionando..."
                  ) : (
                    <>
                      {m.label}
                      {badge && (
                        <span className="text-[10px] border border-foreground/40 text-foreground rounded-full px-1.5 py-0.5 leading-none font-semibold">
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}

            {remainingMessages !== null && remainingMessages !== undefined && (
              <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border mt-1">
                {remainingMessages} mensagens restantes
              </div>
            )}
            {checkoutError && (
              <div className="px-4 py-2 text-xs text-destructive border-t border-border mt-1">
                {checkoutError}
              </div>
            )}
            <div className="border-t border-border mt-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-foreground/50 hover:bg-accent transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
