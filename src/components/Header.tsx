import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const models = [
  { id: "sof-v1-free", label: "sof-v1-free" },
  { id: "sof-v1-pro", label: "sof-v1-pro" },
];

interface HeaderProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  remainingMessages?: number | null;
}

const Header = ({ selectedModel, onModelChange, remainingMessages }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-popover rounded-2xl py-2 min-w-[180px] border border-border">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => { onModelChange(m.id); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent ${
                  selectedModel === m.id ? "text-foreground font-semibold" : "text-foreground/50"
                }`}
              >
                {m.label}
              </button>
            ))}
            {remainingMessages !== null && remainingMessages !== undefined && (
              <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border mt-1">
                {remainingMessages} mensagens restantes
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
