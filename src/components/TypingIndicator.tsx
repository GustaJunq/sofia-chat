type TypingStatus = "thinking" | "wikipedia";

interface TypingIndicatorProps {
  status?: TypingStatus;
}

const TypingIndicator = ({ status = "thinking" }: TypingIndicatorProps) => (
  <div className="flex justify-start mb-3">
    {status === "wikipedia" ? (
      <div className="flex items-center gap-2 py-2 px-1 text-foreground/50 text-[13px]">
        <span className="inline-block w-2 h-2 rounded-full bg-foreground/40 animate-pulse" />
        Acessando Wikipedia...
      </div>
    ) : (
      <div className="flex items-center gap-1.5 py-3 px-1">
        <span className="w-2 h-2 rounded-full bg-foreground typing-dot" />
        <span className="w-2 h-2 rounded-full bg-foreground typing-dot" />
        <span className="w-2 h-2 rounded-full bg-foreground typing-dot" />
      </div>
    )}
  </div>
);

export default TypingIndicator;
