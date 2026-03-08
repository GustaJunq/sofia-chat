import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Pause, Loader2, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { fetchTTS, getToken } from "@/lib/api";

declare global {
  interface Window {
    renderMathInElement?: (el: HTMLElement, opts: unknown) => void;
  }
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  onPlayRequest?: (play: () => Promise<void>, pause: () => void) => void;
}

const MessageBubble = ({ role, content, thinking, onPlayRequest }: MessageBubbleProps) => {
  const [ttsState, setTtsState] = useState<"idle" | "loading" | "playing">("idle");
  const [showThinking, setShowThinking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setTtsState("idle");
  }, []);

  const play = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setTtsState("loading");
    try {
      const blob = await fetchTTS(token, content);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setTtsState("idle");
      audio.onerror = () => setTtsState("idle");
      await audio.play();
      setTtsState("playing");
    } catch {
      setTtsState("idle");
    }
  }, [content]);

  useEffect(() => {
    if (role !== "assistant" || !contentRef.current) return;
    const tryRender = () => {
      if (window.renderMathInElement && contentRef.current) {
        window.renderMathInElement(contentRef.current, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
          ],
          throwOnError: false,
        });
      }
    };
    if (window.renderMathInElement) {
      tryRender();
    } else {
      const timer = setInterval(() => {
        if (window.renderMathInElement) {
          clearInterval(timer);
          tryRender();
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, [content, role]);

  const handleTTSClick = () => {
    if (ttsState === "playing") { pause(); return; }
    if (ttsState === "loading") return;
    onPlayRequest?.(play, pause);
  };

  if (role === "user") {
    return (
      <div className="msg-user-row">
        <div className="msg-user-bubble">{content}</div>
      </div>
    );
  }

  return (
    <div className="msg-assistant-row">
      <div className="msg-assistant-content">
        {thinking && (
          <div>
            <button onClick={() => setShowThinking(!showThinking)} className="msg-thinking-btn">
              <Brain className="w-3 h-3" />
              {showThinking ? "Ocultar raciocínio" : "Ver raciocínio"}
              {showThinking ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showThinking && <div className="msg-thinking-block">{thinking}</div>}
          </div>
        )}

        <div ref={contentRef} className="msg-assistant-text">{content}</div>
      </div>

      <button onClick={handleTTSClick} className="msg-tts-btn" title="Ouvir resposta">
        {ttsState === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {ttsState === "playing" && <Pause className="w-4 h-4" />}
        {ttsState === "idle" && <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default MessageBubble;
