const TypingIndicator = () => (
  <div className="flex justify-start mb-3">
    <div className="flex items-center gap-1.5 py-3 px-1">
      <span className="w-2 h-2 rounded-full bg-foreground typing-dot" />
      <span className="w-2 h-2 rounded-full bg-foreground typing-dot" />
      <span className="w-2 h-2 rounded-full bg-foreground typing-dot" />
    </div>
  </div>
);

export default TypingIndicator;
