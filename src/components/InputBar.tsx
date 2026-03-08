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
    <div className="inputbar-wrapper">
      <div className="inputbar-surface">
        <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown} placeholder="Faça uma pergunta..." disabled={disabled}
          rows={1} className="inputbar-textarea" />
        <button onClick={handleSend} disabled={!text.trim() || disabled} className="inputbar-send">
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
      <p className="inputbar-disclaimer">
        sofIA pode "alucinar" nas respostas,<br />então confira bem as respostas.
      </p>
    </div>
  );
};

export default InputBar;
