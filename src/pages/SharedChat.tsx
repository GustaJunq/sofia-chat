import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URL } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface SharedMessage {
  role: "user" | "assistant";
  content: string;
  image_url?: string;
}

interface SharedConversation {
  title: string;
  messages: SharedMessage[];
  created_at?: string;
}

// ─── Minimal message renderer for public view ─────────────────────────────────

const SharedMessageBubble = ({ msg }: { msg: SharedMessage }) => {
  if (msg.role === "user") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            maxWidth: "70%",
            background: "hsl(var(--muted))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "16px 16px 4px 16px",
            padding: "10px 14px",
            fontSize: "0.9rem",
            color: "hsl(var(--foreground))",
            lineHeight: 1.55,
          }}
        >
          {msg.image_url && (
            <img
              src={msg.image_url}
              alt="imagem"
              style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6, display: "block" }}
            />
          )}
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
      {/* AI avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "hsl(var(--muted))",
          border: "1px solid hsl(220 60% 70% / 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <img
          src="/logo.png"
          alt="SynastrIA"
          style={{ width: 18, height: 18, objectFit: "contain", borderRadius: "50%" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          fontSize: "0.9rem",
          color: "hsl(var(--foreground))",
          lineHeight: 1.6,
        }}
        className="prose-chat"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
        {msg.image_url && (
          <img
            src={msg.image_url}
            alt="imagem gerada"
            style={{ maxWidth: "100%", borderRadius: 10, marginTop: 8, display: "block" }}
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
};

// ─── SharedChat page ───────────────────────────────────────────────────────────

const SharedChat = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [conversation, setConversation] = useState<SharedConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;
    // Attempt to load the shared conversation from the backend.
    // The backend should expose a public endpoint that doesn't require auth.
    // Adjust the URL if your backend uses a different public share endpoint.
    fetch(`${API_URL}/share/${shareId}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Conversa não encontrada ou não é pública.");
          throw new Error("Não foi possível carregar a conversa.");
        }
        return res.json();
      })
      .then((data) => {
        setConversation(data);
      })
      .catch((e: Error) => {
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [shareId]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "hsl(var(--background))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <header
        style={{
          width: "100%",
          borderBottom: "1px solid hsl(var(--border))",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "hsl(var(--background) / 0.9)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageSquare
            style={{ width: 16, height: 16, color: "hsl(220 60% 70%)" }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.8rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Conversa compartilhada
          </span>
        </div>

        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "hsl(220 60% 70%)",
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          SynastrIA
          <ExternalLink style={{ width: 11, height: 11 }} />
        </Link>
      </header>

      {/* Content */}
      <main
        style={{
          width: "100%",
          maxWidth: 720,
          padding: "32px 20px 80px",
          flex: 1,
        }}
      >
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              paddingTop: "80px",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            <Loader2
              style={{ width: 24, height: 24, animation: "spin 1s linear infinite" }}
            />
            <span style={{ fontSize: "0.85rem" }}>Carregando conversa…</span>
          </div>
        )}

        {error && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              paddingTop: "80px",
              color: "hsl(var(--muted-foreground))",
              textAlign: "center",
            }}
          >
            <AlertCircle style={{ width: 32, height: 32, color: "hsl(0 72% 51%)" }} />
            <p style={{ fontSize: "0.9rem" }}>{error}</p>
            <Link
              to="/"
              style={{
                marginTop: 8,
                padding: "8px 20px",
                borderRadius: 10,
                background: "hsl(var(--muted))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              Voltar ao início
            </Link>
          </div>
        )}

        {conversation && (
          <>
            {/* Title */}
            <h1
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "hsl(var(--foreground))",
                marginBottom: "28px",
                paddingBottom: "16px",
                borderBottom: "1px solid hsl(var(--border))",
              }}
            >
              {conversation.title}
            </h1>

            {/* Messages */}
            {conversation.messages.map((msg, i) => (
              <SharedMessageBubble key={i} msg={msg} />
            ))}

            {/* CTA */}
            <div
              style={{
                marginTop: 40,
                padding: "20px 24px",
                borderRadius: 14,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--muted) / 0.4)",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", marginBottom: 12 }}>
                Continue essa conversa ou inicie a sua própria.
              </p>
              <Link
                to="/chats"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 22px",
                  borderRadius: 10,
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Abrir SynastrIA
                <ExternalLink style={{ width: 13, height: 13 }} />
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SharedChat;
