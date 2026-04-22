import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bot, Cpu, Globe, Shield, Sparkles, Terminal, Zap } from "lucide-react";
import StarLogo from "@/components/StarLogo";

/* ─── Easing curves (Emil principle: custom curves > built-in) ─── */
const EASE_OUT  = [0.23, 1, 0.32, 1] as const;   // strong ease-out — entries, UI
const EASE_DRAWER = [0.32, 0.72, 0, 1] as const; // iOS-like — large reveals

/* ─── Geist font preconnect + stylesheet ─── */
const GEIST_URLS = [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&display=swap",
  },
];

/* ─── Global keyframes injected once ─── */
const GLOBAL_STYLES = `
  /* Apply Geist across the entire landing */
  #landing-root, #landing-root * {
    font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  @keyframes scrollBounce {
    0%, 100% { transform: translateY(0);   opacity: 0.4; }
    50%       { transform: translateY(4px); opacity: 0.9; }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .landing-scroll-hint {
    animation: scrollBounce 2.2s ease-in-out infinite;
    transform: translateX(-50%);
  }

  /* Gate hover transforms to pointer devices only */
  @media (hover: hover) and (pointer: fine) {
    .feature-card:hover {
      background: rgba(255,255,255,0.035) !important;
    }
    .feature-card:hover .feature-card-border {
      opacity: 1;
    }
    .nav-link:hover {
      color: #fff;
    }
    .footer-link:hover {
      opacity: 1;
    }
  }

  /* Respect reduced-motion: keep opacity, drop movement */
  @media (prefers-reduced-motion: reduce) {
    .landing-scroll-hint {
      animation: none;
      opacity: 0.4;
    }
  }
`;

const Landing = () => {
  const navigate = useNavigate();
  const cubeRef  = useRef<HTMLVideoElement>(null);
  const iconRef  = useRef<HTMLVideoElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  /* inject Geist font links + global keyframes once */
  useEffect(() => {
    GEIST_URLS.forEach(({ rel, href, crossOrigin }) => {
      const linkId = `geist-${href.slice(-12).replace(/\W/g, "")}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = rel;
        link.href = href;
        if (crossOrigin) link.crossOrigin = crossOrigin;
        document.head.appendChild(link);
      }
    });
    const id = "landing-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = GLOBAL_STYLES;
      document.head.appendChild(s);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => {
    [cubeRef, iconRef].forEach((ref) => {
      if (ref.current) ref.current.play().catch(() => {});
    });
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleGetStarted = (e: React.MouseEvent) => {
    const token = localStorage.getItem("sof_token");
    if (token) { e.preventDefault(); navigate("/chats"); }
  };

  /* Emil: start from scale(0.95) + opacity, never scale(0) */
  const fadeUp = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
  };

  const staggerChildren = {
    animate: { transition: { staggerChildren: 0.08 } },
  };

  /* Emil: whileTap scale(0.97) on every pressable element */
  const btnTap = { scale: 0.97 };

  const features = [
    { icon: Bot,      title: "Subagents",   desc: "Create customized AI agents for any task." },
    { icon: Terminal, title: "Skills",       desc: "Extend capabilities with custom skill packs." },
    { icon: Cpu,      title: "Multi-Model",  desc: "GPT, Qwen, Llama, Gemini — we choose the best." },
    { icon: Globe,    title: "Web Access",   desc: "Real-time search and data retrieval." },
    { icon: Shield,   title: "Secure",       desc: "Your data stays yours. Always." },
    { icon: Sparkles, title: "Long memory",  desc: "SofIA remembers everything, just say to save something." },
  ];

  return (
    <div id="landing-root" className="min-h-screen flex flex-col" style={{ background: "#000", color: "#fff" }}>

      {/* ── Navbar ── */}
      <nav
        className="fixed inset-x-0 top-0 z-50"
        style={{
          /* Emil: specify exact properties, never transition-all */
          transition: "background-color 250ms cubic-bezier(0.23,1,0.32,1), backdrop-filter 250ms cubic-bezier(0.23,1,0.32,1), border-color 250ms cubic-bezier(0.23,1,0.32,1)",
          background:      scrolled ? "rgba(0,0,0,0.82)" : "transparent",
          backdropFilter:  scrolled ? "blur(20px) saturate(150%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(150%)" : "none",
          borderBottom:    scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto max-w-[1200px] flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <StarLogo className="w-6 h-6" />
            <span className="text-[15px] font-bold tracking-tight">Synastria</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Products",  to: "/products",  isLink: true },
              { label: "Features",  href: "#features", isLink: false },
              { label: "Log In",    to: "/login",     isLink: true },
            ].map((item) =>
              item.isLink ? (
                <Link
                  key={item.label}
                  to={item.to!}
                  className="nav-link text-[13px] text-[#666]"
                  style={{ transition: "color 180ms ease" }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="nav-link text-[13px] text-[#666]"
                  style={{ transition: "color 180ms ease" }}
                >
                  {item.label}
                </a>
              )
            )}
          </div>

          {/* Emil: whileTap for press feedback + exact transition props */}
          <motion.div whileTap={btnTap} style={{ willChange: "transform" }}>
            <Link
              to="/register"
              onClick={handleGetStarted}
              className="px-4 py-2 rounded-lg text-[13px] font-medium block"
              style={{
                background: "#fff",
                color: "#000",
                transition: "background-color 160ms cubic-bezier(0.23,1,0.32,1)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e0e0e0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
            >
              Sign Up
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center min-h-[100vh] px-6 pt-24 pb-20 overflow-hidden">

        {/* Subtle radial glow behind the logo — depth without distraction */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center max-w-[900px]"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          {/* Logo video */}
          <motion.div
            className="aspect-square mb-10 rounded-2xl overflow-hidden"
            style={{ width: "clamp(180px, 40vw, 280px)" }}
            variants={fadeUp}
            transition={{ duration: 0.75, ease: EASE_OUT }}
          >
            {/* Subtle ring around logo — polish detail users don't consciously notice */}
            <div
              className="w-full h-full relative rounded-2xl"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 24px 64px rgba(0,0,0,0.6)" }}
            >
              <video
                ref={cubeRef}
                src="/cube.mp4"
                autoPlay loop muted playsInline
                className="w-full h-full object-cover rounded-2xl"
                style={{ filter: "grayscale(100%) brightness(1.1)" }}
              />
            </div>
          </motion.div>

          <motion.h1
            className="font-extrabold leading-[0.95] tracking-[-0.04em] mb-6"
            style={{ fontSize: "clamp(2.8rem, 8vw, 5.5rem)" }}
            variants={fadeUp}
            transition={{ duration: 0.75, delay: 0.12, ease: EASE_OUT }}
          >
            Create subagents,
            <br />
            <span style={{ color: "#666" }}>use skills all in the web.</span>
          </motion.h1>

          <motion.p
            className="leading-relaxed max-w-[500px] mb-10"
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
              color: "#555",
            }}
            variants={fadeUp}
            transition={{ duration: 0.75, delay: 0.22, ease: EASE_OUT }}
          >
            A constellation of AI agents inside a single chatbot.
            Build, connect, and deploy intelligent workflows.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4"
            variants={fadeUp}
            transition={{ duration: 0.75, delay: 0.32, ease: EASE_OUT }}
          >
            {/* Primary CTA */}
            <motion.div whileTap={btnTap} style={{ willChange: "transform" }}>
              <Link
                to="/register"
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-[14px] font-semibold"
                style={{
                  background: "#fff",
                  color: "#000",
                  transition: "background-color 160ms cubic-bezier(0.23,1,0.32,1)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e0e0e0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Secondary CTA */}
            <motion.div whileTap={btnTap} style={{ willChange: "transform" }}>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-[14px] font-medium"
                style={{
                  background: "transparent",
                  color: "#666",
                  border: "1px solid rgba(255,255,255,0.12)",
                  transition: "color 160ms ease, border-color 160ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.color = "#ccc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.color = "#666";
                }}
              >
                Learn More
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator — CSS animation (off-thread, smooth even under load) */}
        <div className="absolute bottom-8 left-1/2 landing-scroll-hint">
          <div
            className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
            style={{ border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <div
              className="w-1 h-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.45)" }}
            />
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="relative py-24 lg:py-32 px-6">
        <div className="mx-auto max-w-[1100px]">
          <motion.div
            className="text-center mb-16 lg:mb-20"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: EASE_OUT }}
          >
            <h2
              className="font-bold tracking-[-0.03em] mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              Where AI systems align
            </h2>
            <p
              className="max-w-md mx-auto"
              style={{ fontSize: "clamp(0.9rem, 2vw, 1.05rem)", color: "#555" }}
            >
              Everything you need to build, deploy, and manage AI agents at scale.
            </p>
          </motion.div>

          {/* Grid with gap-px trick for seamless borders */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-hidden"
            style={{
              gap: "1px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="feature-card relative p-8 lg:p-10"
                style={{
                  background: "#000",
                  /* Emil: specify exact transition properties */
                  transition: "background-color 200ms cubic-bezier(0.23,1,0.32,1)",
                }}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: EASE_OUT }}
              >
                {/* Top-border highlight — visible on hover via CSS class above */}
                <div
                  className="feature-card-border absolute inset-x-0 top-0 h-px"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                    opacity: 0,
                    transition: "opacity 200ms ease",
                  }}
                />
                <f.icon
                  className="w-5 h-5 mb-5"
                  style={{ color: "#555" }}
                  strokeWidth={1.5}
                />
                <h3 className="text-[15px] font-semibold mb-2 tracking-tight">{f.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "#4a4a4a" }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Video + Text ── */}
      <section className="py-24 lg:py-32 px-6">
        <div className="mx-auto max-w-[1100px] flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <motion.div
            className="flex-shrink-0 rounded-2xl overflow-hidden"
            style={{
              width: "clamp(100px, 25vw, 200px)",
              aspectRatio: "1",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 16px 48px rgba(0,0,0,0.5)",
            }}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE_DRAWER }}
          >
            <video
              ref={iconRef}
              src="/icon.mp4"
              autoPlay loop muted playsInline
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE_OUT }}
          >
            <h2
              className="font-bold tracking-[-0.03em] mb-5 leading-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              One chatbot.
              <br />
              <span style={{ color: "#444" }}>Infinite agents.</span>
            </h2>
            <p
              className="leading-relaxed max-w-[450px] mx-auto lg:mx-0"
              style={{ fontSize: "clamp(0.9rem, 2vw, 1.05rem)", color: "#4a4a4a" }}
            >
              Create specialized AI agents, connect them into a unified system, and run
              everything through a single intelligent chatbot.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 lg:py-32 px-6">
        <motion.div
          className="mx-auto max-w-[900px] text-center"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <h2
            className="font-extrabold tracking-[-0.04em] mb-6 leading-[0.95]"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            Start building
            <br />
            <span style={{ color: "#444" }}>the future of AI.</span>
          </h2>
          <p
            className="mb-10 mx-auto max-w-[500px]"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", color: "#555" }}
          >
            Join thousands of developers building the next generation of intelligent agents.
          </p>

          {/* Emil: whileTap for press + whileHover only on pointer devices via Framer */}
          <motion.div
            className="inline-block"
            whileTap={btnTap}
            /* Scale on hover only — Framer Motion respects pointer-device implicitly via JS,
               but we also gate the CSS transform via media query above */
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
            style={{ willChange: "transform" }}
          >
            <Link
              to="/register"
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-[16px] font-bold"
              style={{
                background: "#fff",
                color: "#000",
                transition: "background-color 160ms cubic-bezier(0.23,1,0.32,1)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e0e0e0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-12 px-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="mx-auto max-w-[1100px] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5" style={{ opacity: 0.4 }}>
            <StarLogo className="w-5 h-5" />
            <span className="text-[14px] font-bold tracking-tight">Synastria</span>
          </div>

          <p className="text-[12px]" style={{ opacity: 0.25 }}>
            © 2026 Synastria Networks. All rights reserved.
          </p>

          <div className="flex gap-8">
            {["Twitter", "GitHub", "Discord"].map((label) => (
              <a
                key={label}
                href="#"
                className="footer-link text-[12px]"
                style={{
                  opacity: 0.35,
                  transition: "opacity 160ms ease",
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
