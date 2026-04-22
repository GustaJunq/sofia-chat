import StarLogo from "./StarLogo";
import { motion } from "framer-motion";

interface HeroViewProps {
  visible: boolean;
}

const HeroView = ({ visible }: HeroViewProps) => {
  return (
    <div
      className="hero-container"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-40px)",
      }}
    >
      <motion.div
        className="hero-inner"
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          // Strong spring ease-out — feels instant and alive
          duration: 0.55,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        <div className="hero-glow" />
        <StarLogo
          className="w-[100px] h-[100px] animate-star-pulse relative z-10"
          style={{ filter: "grayscale(100%) brightness(1.2)" }}
        />
      </motion.div>
    </div>
  );
};

export default HeroView;
