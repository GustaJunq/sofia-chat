import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Cpu, Globe, Shield, Sparkles, Terminal, Zap } from "lucide-react";
import StarLogo from "@/components/StarLogo";

const Landing = () => {
  const navigate = useNavigate();
  const cubeRef = useRef<HTMLVideoElement>(null);
  const iconRef = useRef<HTMLVideoElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sof_token");
    if (token) {
      navigate("/chats", { replace: true });
      return;
    }

    [cubeRef, iconRef].forEach((ref) => {
      if (ref.current) ref.current.play().catch(() => {});
    });
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [navigate]);

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  };

  const staggerChildren = {
    animate: { transition: { staggerChildren: 0.1 } },
  };

  const features = [
    { icon: Bot, title: "Subagents", desc: "Create customized AI agents for any task." },
    { icon: Terminal, title: "Skills", desc: "Extend capabilities with custom skill packs." },
    { icon: Cpu, title: "Multi-Model", desc: "GPT, Qwen, Llama, Gemini — we choose the best." },
    { icon: Globe, title: "Web Access", desc: "Real-time search and data retrieval." },
    { icon: Shield, title: "Secure", desc: "Your data stays yours. Always." },
    { icon: Sparkles, title: "Long memory", desc: "SofIA remembers everything, just say to save something." },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000", color: "#fff" }}>
      {/* ── Navbar ── */}
      <nav
        className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(0,0,0,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(16px) saturate(140%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto max-w-[1200px] flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <StarLogo className="w-6 h-6" />
            <span className="text-[15px] font-bold tracking-tight">Synastria</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/products" className="text-[13px] text-[#888] hover:text-white transition-colors duration-200">
              Products
            </Link>
            <a href="#features" className="text-[13px] text-[#888] hover:text-white transition-colors duration-200">
              Features
            </a>
            <Link to="/login" className="text-[13px] text-[#888] hover:text-white transition-colors duration-200">
              Log In
            </Link>
          </div>

          <Link
            to="/register"
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200"
            style={{
              background: "#fff",
              color: "#000",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e0e0e0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center min-h-[100vh] px-6 pt-24 pb-20 overflow-hidden">
        {/* Subtle radial gradient removed */}

        <motion.div
          className="relative z-10 flex flex-col items-center text-center max-w-[900px]"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          {/* 3D Logo / Video */}
          <motion.div
            className="w-[clamp(180px,40vw,280px)] aspect-square mb-10 rounded-2xl overflow-hidden"
            {...fadeUp}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <video
              ref={cubeRef}
              src="/cube.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ filter: "grayscale(100%) brightness(1.1)" }}
            />
          </motion.div>

          <motion.h1
            className="text-[clamp(2.8rem,8vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] mb-6"
            {...fadeUp}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            Create subagents,
            <br />
            <span style={{ color: "#888" }}>use skills all in the web.</span>
          </motion.h1>

          <motion.p
            className="text-[clamp(1rem,2.5vw,1.25rem)] leading-relaxed max-w-[500px] mb-10"
            style={{ color: "#666" }}
            {...fadeUp}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            A constellation of AI agents inside a single chatbot.
            Build, connect, and deploy intelligent workflows.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4"
            {...fadeUp}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-[14px] font-semibold transition-all duration-200"
              style={{ background: "#fff", color: "#000" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e0e0e0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-[14px] font-medium transition-all duration-200"
              style={{
                background: "transparent",
                color: "#888",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "#888";
              }}
            >
              Learn More
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 landing-scroll-hint">
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="relative py-24 lg:py-32 px-6">
        <div className="mx-auto max-w-[1100px]">
          <motion.div
            className="text-center mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] mb-4">
              Where AI systems align
            </h2>
            <p className="text-[clamp(0.9rem,2vw,1.1rem)] max-w-md mx-auto" style={{ color: "#666" }}>
              Everything you need to build, deploy, and manage AI agents at scale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="p-8 lg:p-10 transition-colors duration-300"
                style={{ background: "#000" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#000"; }}
              >
                <f.icon className="w-5 h-5 mb-4" style={{ color: "#666" }} strokeWidth={1.5} />
                <h3 className="text-[15px] font-semibold mb-2 tracking-tight">{f.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "#555" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Video + Text ── */}
      <section className="py-24 lg:py-32 px-6">
        <div className="mx-auto max-w-[1100px] flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <motion.div
            className="w-[clamp(100px,25vw,200px)] lg:w-[280px] aspect-square rounded-2xl overflow-hidden flex-shrink-0"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <video
              ref={iconRef}
              src="/icon.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ filter: "grayscale(100%) brightness(1.1)" }}
            />
          </motion.div>

          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] mb-5 leading-tight">
              One chatbot.
              <br />
              <span style={{ color: "#555" }}>Infinite agents.</span>
            </h2>
            <p className="text-[clamp(0.9rem,2vw,1.05rem)] leading-relaxed max-w-[450px] mx-auto lg:mx-0" style={{ color: "#555" }}>
              Create specialized AI agents, connect them into a unified system, and run everything through a single intelligent chatbot.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 lg:py-32 px-6">
        <motion.div
          className="mx-auto max-w-[900px] text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-[clamp(2.5rem,7vw,5rem)] font-extrabold tracking-[-0.04em] mb-6 leading-[0.95]">
            Start building
            <br />
            <span style={{ color: "#555" }}>the future of AI.</span>
          </h2>
          <p className="text-[clamp(1rem,2.5vw,1.25rem)] mb-10 mx-auto max-w-[500px]" style={{ color: "#666" }}>
            Join thousands of developers building the next generation of intelligent agents.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-[16px] font-bold transition-all duration-300"
            style={{ background: "#fff", color: "#000" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.background = "#e0e0e0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "#fff";
            }}
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t border-white/[0.06]">
        <div className="mx-auto max-w-[1100px] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5 opacity-50">
            <StarLogo className="w-5 h-5" />
            <span className="text-[14px] font-bold tracking-tight">Synastria</span>
          </div>
          <p className="text-[12px] opacity-30">
            © 2026 Synastria Networks. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[12px] opacity-40 hover:opacity-100 transition-opacity">Twitter</a>
            <a href="#" className="text-[12px] opacity-40 hover:opacity-100 transition-opacity">GitHub</a>
            <a href="#" className="text-[12px] opacity-40 hover:opacity-100 transition-opacity">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
