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
      <div className="flex justify-end mb-3">
        <div className="bg-primary text-primary-foreground rounded-[18px_18px_4px_18px] px-3.5 py-2.5 max-w-[75%] text-[15px] leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex justify-start mb-3 gap-1.5 items-start">
      <div className="max-w-[90%] flex flex-col gap-1.5">
        {/* Bloco de raciocínio */}
        {thinking && (
          <div>
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Brain className="w-3 h-3" />
              {showThinking ? "Ocultar raciocínio" : "Ver raciocínio"}
              {showThinking ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showThinking && (
              <div className="mt-1.5 p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {thinking}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo da mensagem */}
        <div
          ref={contentRef}
          className="text-foreground text-[15px] leading-[1.7] whitespace-pre-wrap"
        >
          {content}
        </div>
      </div>

      <button
        onClick={handleTTSClick}
        className="flex-shrink-0 mt-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-foreground/40 hover:text-foreground/80"
        title="Ouvir resposta"
      >
        {ttsState === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {ttsState === "playing" && <Pause className="w-4 h-4" />}
        {ttsState === "idle" && <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default MessageBubble;
