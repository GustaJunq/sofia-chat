import { motion } from "framer-motion";

type TypingStatus = "thinking" | "wikipedia";

interface TypingIndicatorProps {
  status?: TypingStatus;
}

const TypingIndicator = ({ status = "thinking" }: TypingIndicatorProps) => (
  <motion.div
    className="flex justify-start mb-3"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {status === "wikipedia" ? (
      <div className="flex items-center gap-2 py-2 px-1 text-muted-foreground text-[13px]">
        <span className="inline-block w-2 h-2 rounded-full bg-white/40 animate-pulse" />
        Respondendo...
      </div>
    ) : (
      <div className="flex items-center gap-1.5 py-3 px-1">
        <span className="w-2 h-2 rounded-full bg-white/60 typing-dot" />
        <span className="w-2 h-2 rounded-full bg-white/60 typing-dot" />
        <span className="w-2 h-2 rounded-full bg-white/60 typing-dot" />
      </div>
    )}
  </motion.div>
);

export default TypingIndicator;
