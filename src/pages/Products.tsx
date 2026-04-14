import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Zap } from "lucide-react";
import StarLogo from "../components/StarLogo";

const Products = () => {
  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000", color: "#fff" }}>
      {/* Header */}
      <header className="w-full px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <Link to="/" className="flex items-center gap-2 text-sm transition-colors duration-200" style={{ color: "#666" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-16 lg:py-24">
        <motion.h1
          className="text-[clamp(2rem,6vw,3rem)] font-bold leading-tight mb-4 text-center tracking-[-0.03em]"
          {...fadeUp}
          transition={{ duration: 0.6 }}
        >
          Our Products
        </motion.h1>
        <motion.p
          className="text-base lg:text-lg mb-16 text-center max-w-md"
          style={{ color: "#555" }}
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Discover the solutions developed by Synastria
        </motion.p>

        {/* Product Card - SofIA */}
        <motion.div
          className="w-full max-w-lg"
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link to="/register" className="block group">
            <div
              className="relative p-8 rounded-2xl border transition-all duration-300 overflow-hidden"
              style={{
                background: "hsl(0 0% 4%)",
                borderColor: "rgba(255,255,255,0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              }}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <StarLogo className="w-7 h-7" />
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold mb-3 tracking-[-0.02em]">SofIA</h2>
              <p className="text-sm lg:text-base leading-relaxed mb-6" style={{ color: "#555" }}>
                Our advanced artificial intelligence, designed to assist with conversations,
                analysis and complex tasks with precision and agility.
              </p>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-xs" style={{ color: "#666" }}>
                  <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                  Smart chat
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "#666" }}>
                  <Zap className="w-4 h-4" strokeWidth={1.5} />
                  Fast responses
                </div>
              </div>

              <div className="inline-flex items-center text-sm font-medium transition-all duration-300 group-hover:translate-x-1" style={{ color: "#888" }}>
                Get started
                <span className="ml-2">→</span>
              </div>
            </div>
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t px-8 py-5 flex justify-between items-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="text-[0.65rem] tracking-widest uppercase" style={{ color: "#333" }}>
          SynastrIA © {new Date().getFullYear()}
        </span>
        <div className="flex gap-6">
          <Link to="/register" className="text-[0.65rem] tracking-widest uppercase transition-colors duration-200" style={{ color: "#444", textDecoration: "none" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#444"}
          >
            Sign Up
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Products;
