import { useState, useRef, useCallback } from "react";
import { Volume2, Pause, Loader2, Brain, ChevronDown, ChevronUp, Copy, Check, ClipboardCopy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { fetchTTS, getToken } from "@/lib/api";

const CodeBlock = ({ children, className }: { children: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(children.replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{lang}</span>
        <button onClick={handleCopy} className="code-copy-btn">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre><code className={className}>{children}</code></pre>
    </div>
  );
};

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  imagePreview?: string;
  onPlayRequest?: (play: () => Promise<void>, pause: () => void) => void;
}

const MessageBubble = ({ role, content, thinking, imagePreview, onPlayRequest }: MessageBubbleProps) => {
  const [ttsState, setTtsState] = useState<"idle" | "loading" | "playing">("idle");
  const [showThinking, setShowThinking] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

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

  const handleTTSClick = () => {
    if (ttsState === "playing") { pause(); return; }
    if (ttsState === "loading") return;
    onPlayRequest?.(play, pause);
  };

  if (role === "user") {
    return (
      <div className="msg-user-row">
        <div className="msg-user-bubble">
          {imagePreview && (
            <img src={imagePreview} alt="Imagem enviada" className="msg-user-image" />
          )}
          {content && <span>{content}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="group msg-assistant-row">
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

        <div className="msg-assistant-text prose-chat">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        </div>
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
