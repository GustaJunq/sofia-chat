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

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      size: 0.5 + Math.random() * 1.2,
      alpha: 0.1 + Math.random() * 0.4,
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
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
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
      style={{ opacity: 0.45 }}
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
              i * 55
            );
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Shared button styles ── */
const btnGhost =
  "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium uppercase tracking-widest transition-all duration-150 " +
  "border-white/20 text-white/50 hover:bg-white/8 hover:text-white hover:border-white/30";

const btnSolid =
  "inline-flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-semibold uppercase tracking-widest transition-all duration-150 " +
  "border-white bg-white text-black hover:opacity-85 hover:scale-[1.02]";

/* ── Features data ── */
const features = [
  {
    title: "Chat inteligente",
    desc: "Converse naturalmente. A sofIA entende contexto, memória da conversa e responde com precisão.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M8 9h8M8 13h6M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
      </svg>
    ),
  },
  {
    title: "Raciocínio avançado",
    desc: "Resolva problemas complexos, análises matemáticas e lógicas com o modelo sof-v1-pro.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/><path d="M3 12h3m12 0h3M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/>
      </svg>
    ),
  },
  {
    title: "Geração de imagens",
    desc: "Descreva e crie imagens originais com IA. Basta digitar o que você quer ver.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    title: "Modo voz",
    desc: "Fale diretamente com a sofIA. Segure para gravar, ela processa e responde em áudio.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/>
      </svg>
    ),
  },
  {
    title: "Visão computacional",
    desc: "Envie imagens e a sofIA analisa, descreve e responde perguntas sobre o que vê.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M4 16l4.6-4.6a2 2 0 0 1 2.8 0L16 16"/><path d="m14 14 1.6-1.6a2 2 0 0 1 2.8 0L20 14"/><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      </svg>
    ),
  },
  {
    title: "Histórico de chats",
    desc: "Todas as suas conversas salvas e acessíveis. Continue de onde parou, quando quiser.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    ),
  },
];

/* ── FAQ data ── */
const faqs = [
  {
    q: "O que é a sofIA?",
    a: "A sofIA é uma assistente de inteligência artificial criada para conversar, raciocinar e criar. Use para tirar dúvidas, escrever textos, resolver problemas e gerar imagens — tudo numa interface simples.",
  },
  {
    q: "Preciso de cartão de crédito para começar?",
    a: "Não. O plano gratuito não exige cartão de crédito. Basta criar uma conta e já começar a usar. O cartão só é necessário para assinar o plano Pro.",
  },
  {
    q: "Qual a diferença entre sof-v1-free e sof-v1-pro?",
    a: "O sof-v1-free é ótimo para o dia a dia. O sof-v1-pro possui raciocínio mais avançado — ideal para tarefas complexas como análises, código avançado e respostas mais elaboradas.",
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
    <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-5 gap-4 text-left transition-colors hover:text-white/60"
        style={{ fontFamily: "var(--font-geist-mono, 'JetBrains Mono', monospace)", fontSize: "0.78rem", letterSpacing: "0.04em", color: "hsl(var(--foreground))" }}
      >
        {q}
        <Plus
          className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)", color: "rgba(255,255,255,0.4)" }}
        />
      </button>
      <div className={`faq-answer-inner${open ? " faq-answer-inner--open" : ""}`}>
        <p className="pb-5" style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.8, letterSpacing: "0.02em" }}>
          {a}
        </p>
      </div>
    </div>
  );
}

/* ── Landing page ── */
const Landing = () => {
  const navigate = useNavigate();

  // Se já estiver logado, vai pro chat
  useEffect(() => {
    const token = sessionStorage.getItem("sof_token");
    if (token) navigate("/chats", { replace: true });
  }, [navigate]);

  useReveal();

  const sectionLabel = "text-[0.65rem] uppercase tracking-[0.16em] mb-12";

  return (
    <div className="relative bg-background text-foreground overflow-x-hidden" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
      <ParticleCanvas />

      {/* ── Nav ── */}
      <nav className="fixed inset-x-0 top-0 z-50">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
          <span className="text-[0.75rem] font-semibold uppercase tracking-[0.14em]">sofIA</span>

          <ul className="hidden md:flex gap-1 list-none">
            {["Recursos", "Planos", "FAQ"].map((item) => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase()}`}
                  className="block px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.06em] transition-colors"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                >
                  {item}
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
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-10">
          <h1
            className="landing-fade-1 font-semibold leading-none"
            style={{ fontSize: "clamp(5rem,18vw,14rem)", letterSpacing: "-0.04em" }}
          >
            sofIA
          </h1>

          <div className="landing-fade-2 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 flex-wrap">
            <p className="text-[0.85rem] leading-relaxed max-w-[26ch]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Inteligência artificial que responde,<br />raciocina e cria — para você.
            </p>
            <div className="landing-fade-3 flex gap-3 items-center flex-wrap">
              <Link to="/register" className={btnSolid}>Começar grátis</Link>
              <a href="#recursos" className={btnGhost}>Ver recursos</a>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="landing-scroll-hint absolute bottom-8 left-1/2 flex flex-col items-center gap-1.5" style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          <ArrowDown className="w-4 h-4" />
          scroll
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-10 mx-4 lg:mx-6" style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />

      {/* ── Features ── */}
      <section id="recursos" className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 py-24">
        <p className={`landing-reveal ${sectionLabel}`} style={{ color: "rgba(255,255,255,0.45)" }}>— Recursos</p>
        <div
          className="grid border"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 1, borderColor: "rgba(255,255,255,0.1)" }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="landing-reveal p-8 transition-colors cursor-default"
              style={{ background: "rgba(255,255,255,0.02)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
            >
              <div className="mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>{f.icon}</div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.06em] mb-2">{f.title}</p>
              <p className="text-[0.7rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        id="planos"
        className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 py-24"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <p className={`landing-reveal ${sectionLabel}`} style={{ color: "rgba(255,255,255,0.45)" }}>— Planos</p>
        <h2 className="landing-reveal font-semibold leading-tight mb-14" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", letterSpacing: "-0.03em" }}>
          Simples.<br />Sem surpresas.
        </h2>

        <div
          className="grid border"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, borderColor: "rgba(255,255,255,0.1)" }}
        >
          {/* Free */}
          <div className="landing-reveal flex flex-col gap-6 p-10" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.12em] mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>Free</p>
              <p className="font-semibold leading-none" style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", letterSpacing: "-0.03em" }}>
                R$&nbsp;0 <span className="text-[0.72rem] font-normal" style={{ color: "rgba(255,255,255,0.45)" }}>/ mês</span>
              </p>
            </div>
            <p className="text-[0.7rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>Para experimentar. Sem cartão de crédito.</p>
            <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
            <ul className="flex flex-col gap-3">
              {["Modelo sof-v1-free", "Mensagens limitadas por dia", "Histórico de conversas", "Modo voz"].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.7rem]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#fff" }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className={`${btnGhost} justify-center mt-auto`}>Começar grátis</Link>
          </div>

          {/* Pro */}
          <div className="landing-reveal flex flex-col gap-6 p-10" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div>
              <span
                className="inline-block text-[0.6rem] uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border mb-3"
                style={{ borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.55)" }}
              >
                Recomendado
              </span>
              <p className="text-[0.68rem] uppercase tracking-[0.12em] mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>Pro</p>
              <p className="font-semibold leading-none" style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", letterSpacing: "-0.03em" }}>
                R$&nbsp;29 <span className="text-[0.72rem] font-normal" style={{ color: "rgba(255,255,255,0.45)" }}>/ mês</span>
              </p>
            </div>
            <p className="text-[0.7rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>Para quem usa de verdade. Sem limites, sem filas.</p>
            <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
            <ul className="flex flex-col gap-3">
              {[
                "Modelos sof-v1-free e sof-v1-pro",
                "Mensagens ilimitadas",
                "Geração de imagens com IA",
                "Raciocínio avançado",
                "Suporte prioritário",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.7rem]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#fff" }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className={`${btnSolid} justify-center mt-auto`}>Assinar Pro</Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        id="faq"
        className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 py-24"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <p className={`landing-reveal ${sectionLabel}`} style={{ color: "rgba(255,255,255,0.45)" }}>— Perguntas frequentes</p>
        <h2 className="landing-reveal font-semibold leading-tight mb-0" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", letterSpacing: "-0.03em" }}>
          Tem dúvidas?
        </h2>

        <div
          className="landing-reveal mt-12"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 px-4 lg:px-6 py-8"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <span className="text-[0.68rem] uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.35)" }}>
            sofIA © {new Date().getFullYear()}
          </span>
          <div className="flex gap-6">
            {[
              { label: "Entrar", to: "/login" },
              { label: "Cadastrar", to: "/register" },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-[0.65rem] uppercase tracking-[0.08em] transition-colors"
                style={{ color: "rgba(255,255,255,0.2)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
              >
                {label}
              </Link>
            ))}
            <a
              href="/sofia.apk"
              download
              className="text-[0.65rem] uppercase tracking-[0.08em] transition-colors"
              style={{ color: "rgba(255,255,255,0.2)", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
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
