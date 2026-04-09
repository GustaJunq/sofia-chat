import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Landing = () => {
  const cubeRef = useRef<HTMLVideoElement>(null);
  const iconRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    [cubeRef, iconRef].forEach((ref) => {
      if (ref.current) ref.current.play().catch(() => {});
    });
  }, []);

  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col items-center overflow-x-hidden"
      style={{
        background: "#000000",
        color: "hsl(210 20% 92%)",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center px-6 pt-16 pb-0 w-full max-w-[540px] text-center lg:max-w-[1200px] lg:flex-row lg:justify-center lg:text-left lg:gap-20 lg:pt-24 lg:px-10">
        <motion.div
          className="w-[clamp(160px,42vw,220px)] aspect-square mb-7 lg:w-[400px] lg:mb-0 lg:order-2"
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <video ref={cubeRef} src="/cube.mp4" autoPlay loop muted playsInline
            className="w-full h-full object-cover rounded-2xl"
          />
        </motion.div>

        <div className="flex flex-col items-center lg:items-start">
          <motion.h1
            className="text-[clamp(2.6rem,9vw,3.6rem)] lg:text-[5rem] font-semibold leading-none mb-6 lg:mb-5"
            style={{ letterSpacing: "-0.04em" }}
            {...fadeUp}
            transition={{ duration: 0.6 }}
          >
            Synastria
          </motion.h1>

          <motion.p
            className="text-[clamp(0.95rem,3.2vw,1.12rem)] lg:text-[1.4rem] font-normal leading-relaxed max-w-[300px] lg:max-w-[450px] mb-9 lg:mb-12"
            style={{ color: "hsl(220 10% 50%)" }}
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            A constellation of AI agents<br />inside a single chatbot.
          </motion.p>

          <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }}>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-medium uppercase tracking-wider transition-all duration-300"
              style={{
                background: "hsl(250 80% 68%)",
                color: "#fff",
                letterSpacing: "0.06em",
                boxShadow: "0 8px 30px hsl(250 80% 68% / 0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 40px hsl(250 80% 68% / 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 30px hsl(250 80% 68% / 0.25)";
              }}
            >
              Get started
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="flex flex-col items-center px-6 pt-20 pb-0 w-full max-w-[540px] text-center lg:max-w-[1200px] lg:flex-row-reverse lg:justify-center lg:text-left lg:gap-24 lg:py-28 lg:px-10">
        <motion.div
          className="w-[clamp(80px,22vw,110px)] lg:w-[280px] aspect-square rounded-2xl overflow-hidden mb-7 lg:mb-0"
          style={{
            boxShadow: "0 0 50px 8px hsl(250 60% 60% / 0.12)",
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <video ref={iconRef} src="/icon.mp4" autoPlay loop muted playsInline
            className="w-full h-full object-cover"
          />
        </motion.div>

        <div className="flex flex-col items-center lg:items-start">
          <motion.h2
            className="text-[clamp(3.2rem,12vw,5.2rem)] lg:text-[6rem] font-semibold leading-none mb-6"
            style={{ letterSpacing: "-0.04em" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Where AI<br />systems align
          </motion.h2>

          <motion.p
            className="text-[clamp(0.88rem,2.9vw,1.02rem)] lg:text-[1.15rem] font-normal leading-relaxed max-w-[280px] lg:max-w-[450px] mb-16"
            style={{ color: "hsl(220 10% 45%)" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Create specialized AI agents, connect them into
            a unified system, and run everything through a single
            intelligent chatbot.
          </motion.p>
        </div>
      </div>

      {/* CTA */}
      <motion.div
        className="w-full max-w-[540px] lg:max-w-[1200px] px-6 pb-24 lg:pb-40 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Link
          to="/register"
          className="inline-block text-[clamp(4.8rem,18vw,8rem)] lg:text-[12rem] font-semibold leading-none transition-all duration-300"
          style={{
            letterSpacing: "-0.04em",
            color: "hsl(210 20% 92%)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.6";
            e.currentTarget.style.textShadow = "0 0 60px hsl(250 80% 68% / 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.textShadow = "none";
          }}
        >
          Try now.
        </Link>
      </motion.div>

      {/* Footer */}
      <footer className="w-full border-t px-8 py-5 flex justify-between items-center"
        style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
      >
        <span className="text-[0.65rem] tracking-widest uppercase"
          style={{ color: "hsl(220 10% 25%)" }}
        >
          SynastrIA © {new Date().getFullYear()}
        </span>
        <div className="flex gap-6">
          <Link to="/login" className="text-[0.65rem] tracking-widest uppercase transition-colors duration-300"
            style={{ color: "hsl(220 10% 25%)", textDecoration: "none" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "hsl(250 80% 68%)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "hsl(220 10% 25%)"}
          >
            Entrar
          </Link>
          <Link to="/register" className="text-[0.65rem] tracking-widest uppercase transition-colors duration-300"
            style={{ color: "hsl(220 10% 25%)", textDecoration: "none" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "hsl(250 80% 68%)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "hsl(220 10% 25%)"}
          >
            Cadastrar
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
