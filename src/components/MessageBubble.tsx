import { useState, useRef, useCallback } from "react";
import { Volume2, Pause, Loader2, Brain, ChevronDown, ChevronUp, Copy, Check, ClipboardCopy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { fetchTTS, getToken } from "@/lib/api";
import { useProfile } from "@/hooks/useProfile";

// ─── Model metadata (avatars in /public/) ─────────────────────────────────────

const MODEL_META: Record<string, { displayName: string; avatar: string; color: string }> = {
  "syn-v1-free": {
    displayName: "SYN-V1-FREE",
    avatar: "/syn-v1-free.png",
    color: "hsl(220 60% 70%)",
  },
  "syn-v1-pro": {
    displayName: "SYN-V1-PRO",
    avatar: "/syn-v1-pro.png",
    color: "hsl(45 90% 60%)",
  },
  "syn-v1-qwen": {
    displayName: "SYN-V1-QWEN",
    avatar: "/syn-v1-qwen.png",
    color: "hsl(160 60% 55%)",
  },
  "syn-v1-llama": {
    displayName: "SYN-V1-LLAMA",
    avatar: "/syn-v1-llama.png",
    color: "hsl(280 60% 70%)",
  },
  "syn-v1-kimi": {
    displayName: "SYN-V1-KIMI",
    avatar: "/syn-v1-kimi.png",
    color: "hsl(0 60% 70%)",
  },
};

const DEFAULT_MODEL = "syn-v1-free";

// ─── CodeBlock ────────────────────────────────────────────────────────────────

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
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre><code className={className}>{children}</code></pre>
    </div>
  );
};

// ─── Model Avatar ─────────────────────────────────────────────────────────────

const ModelAvatar = ({ modelSlug }: { modelSlug: string }) => {
  const meta = MODEL_META[modelSlug] ?? MODEL_META[DEFAULT_MODEL];
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        overflow: "hidden",
        background: "hsl(var(--muted))",
        border: `1px solid ${meta.color}40`,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.6rem",
        fontWeight: 700,
        color: meta.color,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {!imgError ? (
        <img
          src={meta.avatar}
          alt={meta.displayName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setImgError(true)}
        />
      ) : (
        // Fallback: first 2 chars of model name
        meta.displayName.slice(0, 2)
      )}
    </div>
  );
};

// ─── MessageBubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  imagePreview?: string;
  imageGenerated?: string;
  onPlayRequest?: (play: () => Promise<void>, pause: () => void) => void;
  modelSlug?: string;
  ttft_ms?: number;
}

const MessageBubble = ({
  role,
  content,
  thinking,
  imagePreview,
  imageGenerated,
  onPlayRequest,
  modelSlug = DEFAULT_MODEL,
  ttft_ms,
}: MessageBubbleProps) => {
  const { profile } = useProfile();
  const [ttsState, setTtsState] = useState<"idle" | "loading" | "playing">("idle");
  const [showThinking, setShowThinking] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const modelMeta = MODEL_META[modelSlug] ?? MODEL_META[DEFAULT_MODEL];

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

  // ── User bubble ──
  if (role === "user") {
    return (
      <div className="msg-user-row">
        <div className="msg-user-bubble">
          {imagePreview && (
            <img src={imagePreview} alt="Sent image" className="msg-user-image" />
          )}
          {content && <span>{content}</span>}
        </div>

        {/* User avatar */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            overflow: "hidden",
            background: "hsl(var(--muted))",
            border: "1px solid hsl(var(--border))",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "hsl(var(--muted-foreground))",
            alignSelf: "flex-end",
            marginBottom: 2,
          }}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="you"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            profile.name.charAt(0).toUpperCase()
          )}
        </div>
      </div>
    );
  }

  // ── Assistant bubble ──
  return (
    <div className="group msg-assistant-row">
      <div className="msg-assistant-content">
        {/* Model header: avatar + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            marginBottom: "6px",
          }}
        >
          <ModelAvatar modelSlug={modelSlug} />
          <span
            style={{
              fontSize: "0.68rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: modelMeta.color,
              fontWeight: 600,
              userSelect: "none",
            }}
          >
            {modelMeta.displayName}
          </span>
        </div>

        {thinking && (
          <div>
            <button onClick={() => setShowThinking(!showThinking)} className="msg-thinking-btn">
              <Brain className="w-3 h-3" />
              {showThinking ? "Hide reasoning" : "Show reasoning"}
              {showThinking ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showThinking && <div className="msg-thinking-block">{thinking}</div>}
          </div>
        )}

        <div className="msg-assistant-text prose-chat">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ className, children, ...props }) {
                const text = String(children);
                const isBlock = className || text.includes("\n");
                if (isBlock) {
                  return <CodeBlock className={className}>{text}</CodeBlock>;
                }
                return <code className={className} {...props}>{children}</code>;
              },
              pre({ children }) {
                return <>{children}</>;
              },
            }}
          >
            {content}
          </ReactMarkdown>
          {imageGenerated && (
            <div className="msg-generated-image-wrapper">
              <img
                src={imageGenerated}
                alt="Generated image"
                className="msg-generated-image"
                loading="lazy"
              />
              <a
                href={imageGenerated}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="msg-generated-image-download"
                title="Download image"
              >
                ↓ Download
              </a>
            </div>
          )}
        </div>
      </div>

      {ttft_ms !== undefined && (
        <div style={{
          fontSize: "0.62rem",
          color: "hsl(var(--muted-foreground))",
          opacity: 0.5,
          marginTop: "4px",
          marginLeft: "33px",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.03em",
          userSelect: "none",
        }}>
          ⚡ {ttft_ms}ms
        </div>
      )}
      <div className="msg-action-buttons">
        <button
          onClick={() => {
            navigator.clipboard.writeText(content);
            setCopiedResponse(true);
            setTimeout(() => setCopiedResponse(false), 2000);
          }}
          className="msg-tts-btn"
          title="Copy response"
        >
          {copiedResponse ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
        </button>
        <button onClick={handleTTSClick} className="msg-tts-btn" title="Listen to response">
          {ttsState === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
          {ttsState === "playing" && <Pause className="w-4 h-4" />}
          {ttsState === "idle" && <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default MessageBubble;
