import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, MessageSquare, Zap } from "lucide-react";

const Products = () => {
  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#000000",
        color: "hsl(210 20% 92%)",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header className="w-full px-6 py-5 flex items-center justify-between border-b"
        style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-sm transition-colors duration-300"
          style={{ color: "hsl(220 10% 50%)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "hsl(210 20% 92%)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "hsl(220 10% 50%)"}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all duration-300"
          style={{
            background: "transparent",
            color: "hsl(210 20% 92%)",
            letterSpacing: "0.06em",
            border: "1px solid hsl(0 0% 100% / 0.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "hsl(250 80% 68%)";
            e.currentTarget.style.color = "hsl(250 80% 68%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "hsl(0 0% 100% / 0.15)";
            e.currentTarget.style.color = "hsl(210 20% 92%)";
          }}
        >
          Entrar
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-16 lg:py-24">
        <motion.h1
          className="text-[clamp(2rem,6vw,3rem)] font-semibold leading-tight mb-4 text-center"
          style={{ letterSpacing: "-0.03em" }}
          {...fadeUp}
          transition={{ duration: 0.6 }}
        >
          Nossos Produtos
        </motion.h1>
        <motion.p
          className="text-base lg:text-lg mb-16 text-center max-w-md"
          style={{ color: "hsl(220 10% 50%)" }}
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Conheça as soluções desenvolvidas pela Synastria
        </motion.p>

        {/* Product Card - SofIA */}
        <motion.div
          className="w-full max-w-lg"
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link
            to="/register"
            className="block group"
          >
            <div
              className="relative p-8 rounded-2xl border transition-all duration-300 overflow-hidden"
              style={{
                background: "hsl(0 0% 100% / 0.02)",
                borderColor: "hsl(0 0% 100% / 0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "hsl(250 80% 68% / 0.4)";
                e.currentTarget.style.boxShadow = "0 0 60px hsl(250 80% 68% / 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(0 0% 100% / 0.08)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Gradient accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{
                  background: "linear-gradient(90deg, hsl(250 80% 68%), hsl(280 70% 60%))",
                }}
              />

              {/* Icon */}
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
                style={{
                  background: "hsl(250 80% 68% / 0.15)",
                }}
              >
                <Sparkles className="w-8 h-8" style={{ color: "hsl(250 80% 68%)" }} />
              </div>

              {/* Title & Description */}
              <h2
                className="text-2xl lg:text-3xl font-semibold mb-3"
                style={{ letterSpacing: "-0.02em" }}
              >
                SofIA
              </h2>
              <p
                className="text-sm lg:text-base leading-relaxed mb-6"
                style={{ color: "hsl(220 10% 50%)" }}
              >
                Nossa inteligência artificial avançada, projetada para auxiliar em conversas, 
                análises e tarefas complexas com precisão e agilidade.
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(220 10% 60%)" }}>
                  <MessageSquare className="w-4 h-4" style={{ color: "hsl(250 80% 68%)" }} />
                  Chat inteligente
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(220 10% 60%)" }}>
                  <Zap className="w-4 h-4" style={{ color: "hsl(250 80% 68%)" }} />
                  Respostas rápidas
                </div>
              </div>

              {/* CTA */}
              <div
                className="inline-flex items-center text-sm font-medium transition-all duration-300 group-hover:translate-x-1"
                style={{ color: "hsl(250 80% 68%)" }}
              >
                Começar agora
                <span className="ml-2">→</span>
              </div>
            </div>
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        className="w-full border-t px-8 py-5 flex justify-between items-center"
        style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
      >
        <span
          className="text-[0.65rem] tracking-widest uppercase"
          style={{ color: "hsl(220 10% 25%)" }}
        >
          SynastrIA © {new Date().getFullYear()}
        </span>
        <div className="flex gap-6">
          <Link
            to="/login"
            className="text-[0.65rem] tracking-widest uppercase transition-colors duration-300"
            style={{ color: "hsl(220 10% 25%)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(250 80% 68%)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(220 10% 25%)")}
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className="text-[0.65rem] tracking-widest uppercase transition-colors duration-300"
            style={{ color: "hsl(220 10% 25%)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(250 80% 68%)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(220 10% 25%)")}
          >
            Cadastrar
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Products;
