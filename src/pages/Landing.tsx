import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, Check, Plus } from "lucide-react";

/* ── Particle canvas ── */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.06,
      size: 0.4 + Math.random() * 1.4,
      alpha: 0.06 + Math.random() * 0.35,
      gold: Math.random() > 0.75,
    }));

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.vx / W * 55;
        p.y += p.vy / H * 55;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(212,175,98,${p.alpha})`
          : `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.55 }}
    />
  );
}

/* ── Scroll reveal hook ── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".landing-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(
              () => e.target.classList.add("landing-reveal-visible"),
              i * 60
            );
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.07 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Shared button styles ── */
const btnGhost =
  "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium uppercase tracking-widest transition-all duration-200 " +
  "border-white/15 text-white/45 hover:bg-white/6 hover:text-white/80 hover:border-white/25";

const btnSolid =
  "inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-200 " +
  "bg-[#d4af62] text-black hover:bg-[#e0bf72] hover:scale-[1.02] shadow-[0_0_24px_rgba(212,175,98,0.25)]";

/* ── Star icon (8-pointed, matching logo) ── */
function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 7.2L21 12l-7.2 1.8L12 22l-1.8-7.2L3 12l7.2-1.8z" opacity="0.9"/>
      <path d="M12 5l1 4.2.8-.8-.8.8L16.8 10l-4.2 1-.6 2.4-.6-2.4-4.2-1 4.2-1L12 5z" opacity="0.5"/>
    </svg>
  );
}

/* ── Features data ── */
const features = [
  {
    title: "Chat inteligente",
    desc: "Converse naturalmente. A SynastrIA entende contexto, memória da conversa e responde com precisão.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path d="M8 9h8M8 13h6M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
      </svg>
    ),
  },
  {
    title: "Raciocínio avançado",
    desc: "Resolva problemas complexos, análises matemáticas e lógicas com o modelo syn-v1-pro.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/><path d="M3 12h3m12 0h3M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/>
      </svg>
    ),
  },
  {
    title: "Geração de imagens",
    desc: "Descreva e crie imagens originais com IA. Basta digitar o que você quer ver.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l5-5 4 4 3-3 5 5"/><circle cx="8.5" cy="8.5" r="1.5"/>
      </svg>
    ),
  },
  {
    title: "Modo voz",
    desc: "Fale diretamente com a SynastrIA. Segure para gravar, ela processa e responde em áudio.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/>
      </svg>
    ),
  },
  {
    title: "Visão computacional",
    desc: "Envie imagens e a SynastrIA analisa, descreve e responde perguntas sobre o que vê.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    title: "Histórico de chats",
    desc: "Todas as suas conversas salvas e acessíveis. Continue de onde parou, quando quiser.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24">
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    ),
  },
];

/* ── FAQ data ── */
const faqs = [
  {
    q: "O que é a SynastrIA?",
    a: "A SynastrIA é uma assistente de inteligência artificial criada para conversar, raciocinar e criar. Use para tirar dúvidas, escrever textos, resolver problemas e gerar imagens — tudo em uma interface simples e poderosa.",
  },
  {
    q: "Preciso de cartão de crédito para começar?",
    a: "Não. O plano gratuito não exige cartão de crédito. Basta criar uma conta e já começar a usar. O cartão só é necessário para assinar o plano Pro.",
  },
  {
    q: "Qual a diferença entre syn-v1-free e syn-v1-pro?",
    a: "O syn-v1-free é ótimo para o dia a dia. O syn-v1-pro possui raciocínio mais avançado — ideal para tarefas complexas como análises, código avançado e respostas mais elaboradas.",
  },
  {
    q: "Posso cancelar o plano Pro quando quiser?",
    a: "Sim. O plano Pro é mensal e você pode cancelar a qualquer momento. Sem multas, sem burocracia.",
  },
  {
    q: "Tem aplicativo para celular?",
    a: "Sim! Disponibilizamos um APK para Android para download direto. Sem precisar da Play Store.",
  },
];

/* ── FAQ item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b transition-colors"
      style={{ borderColor: open ? "rgba(212,175,98,0.2)" : "rgba(255,255,255,0.08)" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-5 gap-4 text-left transition-colors"
        style={{
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: "0.76rem",
          letterSpacing: "0.04em",
          color: open ? "rgba(212,175,98,0.9)" : "rgba(255,255,255,0.55)",
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
      >
        {q}
        <Plus
          className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300"
          style={{
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            color: open ? "rgba(212,175,98,0.8)" : "rgba(255,255,255,0.3)",
          }}
        />
      </button>
      <div className={`faq-answer-inner${open ? " faq-answer-inner--open" : ""}`}>
        <p
          className="pb-5 pr-8"
          style={{
            fontSize: "0.71rem",
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.9,
            letterSpacing: "0.025em",
          }}
        >
          {a}
        </p>
      </div>
    </div>
  );
}

/* ── Landing page ── */
const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("sof_token");
    if (token) navigate("/chats", { replace: true });
  }, [navigate]);

  useReveal();

  const sectionLabel = "text-[0.6rem] uppercase tracking-[0.2em] mb-12 flex items-center gap-3";

  return (
    <div
      className="relative overflow-x-hidden"
      style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        background: "#080808",
        color: "#fff",
      }}
    >
      {/* Global styles */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes starPulse {
          0%, 100% { opacity: 0.15; transform: scale(1) rotate(0deg); }
          50%       { opacity: 0.25; transform: scale(1.04) rotate(22.5deg); }
        }
        .landing-fade-1 { animation: fadeUp 0.9s cubic-bezier(.22,.68,0,1.2) 0.1s both; }
        .landing-fade-2 { animation: fadeUp 0.9s cubic-bezier(.22,.68,0,1.2) 0.28s both; }
        .landing-fade-3 { animation: fadeUp 0.9s cubic-bezier(.22,.68,0,1.2) 0.42s both; }
        .landing-scroll-hint { animation: fadeIn 1s ease 1.2s both; }

        .landing-reveal {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.65s cubic-bezier(.22,.68,0,1.1), transform 0.65s cubic-bezier(.22,.68,0,1.1);
        }
        .landing-reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .faq-answer-inner {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.38s cubic-bezier(.4,0,.2,1);
        }
        .faq-answer-inner--open {
          max-height: 320px;
        }

        .feature-card:hover .feature-icon {
          color: rgba(212,175,98,0.75) !important;
        }
        .feature-card:hover .feature-title {
          color: rgba(212,175,98,0.9) !important;
        }

        .gold-glow {
          text-shadow: 0 0 80px rgba(212,175,98,0.18), 0 0 160px rgba(212,175,98,0.08);
        }

        .nav-blur {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>

      <ParticleCanvas />

      {/* Background star (decorative) */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animation: "starPulse 8s ease-in-out infinite",
        }}
      >
        <StarIcon className="w-[600px] h-[600px] text-[#d4af62]" />
      </div>

      {/* ── Nav ── */}
      <nav className="fixed inset-x-0 top-0 z-50">
        <div
          className="nav-blur absolute inset-x-0 top-0 h-16"
          style={{ background: "linear-gradient(to bottom, rgba(8,8,8,0.85) 60%, transparent)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <StarIcon className="w-4 h-4 text-[#d4af62]" />
            <span
              className="text-[0.72rem] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "rgba(255,255,255,0.9)", letterSpacing: "0.18em" }}
            >
              SynastrIA
            </span>
          </div>

          <ul className="hidden md:flex gap-1 list-none">
            {[
              { label: "Recursos", href: "#recursos" },
              { label: "Planos", href: "#planos" },
              { label: "FAQ", href: "#faq" },
            ].map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="block px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.08em] transition-colors duration-150"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Link to="/login" className={btnGhost}>Entrar</Link>
            <Link to="/register" className={btnSolid}>Começar</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 min-h-svh flex flex-col justify-end px-4 lg:px-6 pb-16">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">

          {/* Eyebrow */}
          <div
            className="landing-fade-1 flex items-center gap-3"
            style={{ color: "rgba(212,175,98,0.6)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}
          >
            <div style={{ width: 20, height: 1, background: "rgba(212,175,98,0.4)" }} />
            Inteligência que ilumina
          </div>

          <h1
            className="landing-fade-1 font-semibold leading-none gold-glow"
            style={{
              fontSize: "clamp(4.5rem,16vw,13rem)",
              letterSpacing: "-0.04em",
              color: "#fff",
            }}
          >
            Synast<span style={{ color: "rgba(212,175,98,0.9)" }}>rIA</span>
          </h1>

          <div className="landing-fade-2 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 flex-wrap">
            <p
              className="text-[0.82rem] leading-relaxed max-w-[28ch]"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Inteligência artificial que responde,<br />
              raciocina e cria — guiada pelas estrelas.
            </p>
            <div className="landing-fade-3 flex gap-3 items-center flex-wrap">
              <Link to="/register" className={btnSolid}>Começar grátis</Link>
              <a href="#recursos" className={btnGhost}>Ver recursos</a>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="landing-scroll-hint absolute bottom-8 left-1/2 flex flex-col items-center gap-2"
          style={{
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.15)",
            fontSize: "0.55rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          <ArrowDown className="w-3.5 h-3.5" />
          scroll
        </div>
      </section>

      {/* ── Divider ── */}
      <div
        className="relative z-10 mx-4 lg:mx-6"
        style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(212,175,98,0.15), transparent)" }}
      />

      {/* ── Features ── */}
      <section id="recursos" className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 py-28">
        <p
          className={`landing-reveal ${sectionLabel}`}
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          <span style={{ display: "inline-block", width: 16, height: 1, background: "rgba(212,175,98,0.4)", marginRight: 8 }} />
          Recursos
        </p>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="landing-reveal feature-card p-8 flex flex-col gap-5 cursor-default transition-all duration-200"
              style={{ background: "#0c0c0c" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,98,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "#0c0c0c")}
            >
              <div
                className="feature-icon transition-colors duration-200"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {f.icon}
              </div>
              <div>
                <p
                  className="feature-title text-[0.72rem] font-semibold uppercase tracking-[0.08em] mb-2.5 transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                >
                  {f.title}
                </p>
                <p
                  className="text-[0.68rem] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.85 }}
                >
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        id="planos"
        className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 py-28"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p
          className={`landing-reveal ${sectionLabel}`}
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          <span style={{ display: "inline-block", width: 16, height: 1, background: "rgba(212,175,98,0.4)", marginRight: 8 }} />
          Planos
        </p>
        <h2
          className="landing-reveal font-semibold leading-tight mb-16"
          style={{ fontSize: "clamp(1.8rem,4vw,3rem)", letterSpacing: "-0.035em" }}
        >
          Simples.<br />
          <span style={{ color: "rgba(255,255,255,0.35)" }}>Sem surpresas.</span>
        </h2>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 1,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Free */}
          <div
            className="landing-reveal flex flex-col gap-7 p-10"
            style={{ background: "#0c0c0c" }}
          >
            <div>
              <p
                className="text-[0.6rem] uppercase tracking-[0.16em] mb-4"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Free
              </p>
              <p
                className="font-semibold leading-none"
                style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", letterSpacing: "-0.04em" }}
              >
                R$&nbsp;0{" "}
                <span
                  className="text-[0.68rem] font-normal"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  / mês
                </span>
              </p>
            </div>
            <p
              className="text-[0.68rem] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Para experimentar. Sem cartão de crédito.
            </p>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
            <ul className="flex flex-col gap-3.5">
              {["Modelo syn-v1-free", "Mensagens limitadas por dia", "Histórico de conversas", "Modo voz"].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[0.68rem]"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  <Check
                    className="w-3 h-3 flex-shrink-0 mt-0.5"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className={`${btnGhost} justify-center mt-auto`}>
              Começar grátis
            </Link>
          </div>

          {/* Pro */}
          <div
            className="landing-reveal flex flex-col gap-7 p-10 relative overflow-hidden"
            style={{ background: "rgba(212,175,98,0.04)" }}
          >
            {/* Gold glow corner */}
            <div
              className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(212,175,98,0.12) 0%, transparent 70%)" }}
            />

            <div>
              <span
                className="inline-block text-[0.55rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border mb-4"
                style={{ borderColor: "rgba(212,175,98,0.35)", color: "rgba(212,175,98,0.7)" }}
              >
                Recomendado
              </span>
              <p
                className="text-[0.6rem] uppercase tracking-[0.16em] mb-3"
                style={{ color: "rgba(212,175,98,0.6)" }}
              >
                Pro
              </p>
              <p
                className="font-semibold leading-none"
                style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", letterSpacing: "-0.04em" }}
              >
                R$&nbsp;24,99{" "}
                <span
                  className="text-[0.68rem] font-normal"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  / mês
                </span>
              </p>
            </div>
            <p
              className="text-[0.68rem] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Para quem usa de verdade. Sem limites, sem filas.
            </p>
            <div style={{ height: 1, background: "rgba(212,175,98,0.15)" }} />
            <ul className="flex flex-col gap-3.5">
              {[
                "Modelos syn-v1-free e syn-v1-pro",
                "Mensagens ilimitadas",
                "Geração de imagens com IA",
                "Raciocínio avançado",
                "Suporte prioritário",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[0.68rem]"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <Check
                    className="w-3 h-3 flex-shrink-0 mt-0.5"
                    style={{ color: "rgba(212,175,98,0.7)" }}
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className={`${btnSolid} justify-center mt-auto`}>
              Assinar Pro
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        id="faq"
        className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 py-28"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p
          className={`landing-reveal ${sectionLabel}`}
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          <span style={{ display: "inline-block", width: 16, height: 1, background: "rgba(212,175,98,0.4)", marginRight: 8 }} />
          Perguntas frequentes
        </p>
        <h2
          className="landing-reveal font-semibold leading-tight mb-14"
          style={{ fontSize: "clamp(1.8rem,4vw,3rem)", letterSpacing: "-0.035em" }}
        >
          Tem dúvidas?
        </h2>

        <div
          className="landing-reveal"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 px-4 lg:px-6 py-8"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.2)" }}>
            <StarIcon className="w-3 h-3 text-[#d4af62] opacity-50" />
            <span className="text-[0.62rem] uppercase tracking-[0.14em]">
              SynastrIA © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex gap-6">
            {[
              { label: "Entrar", to: "/login", isLink: true },
              { label: "Cadastrar", to: "/register", isLink: true },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-[0.6rem] uppercase tracking-[0.1em] transition-colors duration-150"
                style={{ color: "rgba(255,255,255,0.18)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
              >
                {label}
              </Link>
            ))}
            <a
              href="/synastria.apk"
              download
              className="text-[0.6rem] uppercase tracking-[0.1em] transition-colors duration-150"
              style={{ color: "rgba(255,255,255,0.18)", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
            >
              APK
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
