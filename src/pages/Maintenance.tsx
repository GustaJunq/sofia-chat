import { useEffect, useState } from "react";
import StarLogo from "@/components/StarLogo";

const TARGET_DATE = new Date("2026-05-01T00:00:00");

function getTimeLeft() {
  const diff = TARGET_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const Maintenance = () => {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    document.title = "Em manutenção — Retorno 1 de maio";
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const blocks = [
    { label: "Dias", value: time.days },
    { label: "Horas", value: time.hours },
    { label: "Min", value: time.minutes },
    { label: "Seg", value: time.seconds },
  ];

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
      {/* Subtle grid background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Top nav */}
      <header className="relative z-10 px-6 md:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarLogo className="h-6 w-6" />
          <span className="font-display text-sm tracking-tight">SOF</span>
        </div>
        <span className="text-xs text-foreground/50 font-mono uppercase tracking-widest">
          Status: Offline
        </span>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-foreground/60 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-foreground/70">
              Em manutenção
            </span>
          </div>

          <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl tracking-[-0.04em] leading-[0.95] max-w-4xl mx-auto">
            Estamos
            <br />
            <span className="text-foreground/40">aprimorando tudo.</span>
          </h1>

          <p className="mt-6 max-w-xl mx-auto text-base md:text-lg text-foreground/60 leading-relaxed">
            Voltamos com novidades em <span className="text-foreground font-medium">1 de maio de 2026</span>.
            Obrigado pela paciência enquanto construímos a próxima geração da plataforma.
          </p>
        </div>

        {/* Countdown */}
        <div
          className="mt-14 grid grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden max-w-2xl w-full animate-fade-in-up"
          style={{ animationDelay: "120ms" }}
        >
          {blocks.map((b) => (
            <div
              key={b.label}
              className="bg-background px-3 py-6 md:py-8 flex flex-col items-center justify-center"
            >
              <span className="font-display font-bold text-3xl md:text-5xl tracking-tight tabular-nums">
                {String(b.value).padStart(2, "0")}
              </span>
              <span className="mt-2 text-[10px] md:text-xs font-mono uppercase tracking-widest text-foreground/50">
                {b.label}
              </span>
            </div>
          ))}
        </div>

        <div
          className="mt-10 flex flex-col sm:flex-row items-center gap-3 animate-fade-in-up"
          style={{ animationDelay: "240ms" }}
        >
          <a
            href="mailto:contato@sof.app"
            className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Falar conosco
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-white/15 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Voltar à home
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-foreground/40 font-mono">
        <span>© {new Date().getFullYear()} SOF. Todos os direitos reservados.</span>
        <span className="uppercase tracking-widest">v1.1 — Maintenance</span>
      </footer>
    </main>
  );
};

export default Maintenance;
