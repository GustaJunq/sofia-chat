import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const InputBar = ({ onSend, disabled }: InputBarProps) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-5 px-5">
      <div className="w-full max-w-[640px] input-surface rounded-[999px] flex items-end px-4 py-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Faça uma pergunta..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base resize-none outline-none py-2 max-h-[120px] leading-snug"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 ml-2 transition-opacity disabled:opacity-30"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-3 leading-snug">
        sofIA pode "alucinar" nas respostas,
        <br />
        então confira bem as respostas.
      </p>
    </div>
  );
};

export default InputBar;
