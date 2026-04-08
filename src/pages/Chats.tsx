import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import HeroView from "@/components/HeroView";
import ChatView, { type Message } from "@/components/ChatView";
import InputBar from "@/components/InputBar";
import ChatHistory from "@/components/ChatHistory";
import { X, Key, Share2, Check } from "lucide-react";
import { type AgentToolCallEntry } from "@/components/AgentToolCallsBar";
import {
  fetchConversations,
  fetchConversation,
  sendChatMessage,
  sendSandboxMessage,
  generateImage,
  deleteConversation,
  deleteAllConversations,
  type ConversationSummary,
} from "@/lib/api";

const RAG_TRIGGER_WORDS = [
  "quem é", "quem foi", "o que é", "o que foi", "qual é", "qual foi",
  "quando foi", "quando nasceu", "quando morreu", "onde fica", "onde está",
  "me fala sobre", "me fale sobre", "explica", "explique", "define", "defina",
  "história de", "história do", "história da", "biografia", "significado de",
  "who is", "who was", "what is", "what was", "when was", "where is",
  "tell me about", "explain", "define", "history of",
];

const IMAGE_TRIGGER_WORDS = [
  "gera uma imagem", "gera imagem", "gerar imagem", "gerar uma imagem",
  "gere uma imagem", "gere imagem",
  "cria uma imagem", "cria imagem", "criar imagem", "criar uma imagem",
  "desenha", "desenhe", "faz uma imagem", "faz uma foto",
  "generate image", "generate a image", "generate an image",
  "create image", "draw", "make an image", "make a picture",
  "ilustra", "ilustre", "imagina", "visualiza", "/imagine",
];

function isImageRequest(text: string): boolean {
  const lower = text.toLowerCase();
  return IMAGE_TRIGGER_WORDS.some((trigger) => lower.includes(trigger));
}

function isFactualMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return RAG_TRIGGER_WORDS.some((trigger) => lower.includes(trigger));
}

// ─── Share button ──────────────────────────────────────────────────────────────

const ShareButton = ({ conversationId }: { conversationId: string | null }) => {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!conversationId) return null;

  const handleShare = async () => {
    setSharing(true);
    try {
      // The share URL points to our public view page
      // The backend should expose a public endpoint — here we generate the client-side link.
      // If your backend has a /share endpoint, call it here to register the conversation as public.
      const shareUrl = `${window.location.origin}/share/${conversationId}`;

      if (navigator.share) {
        await navigator.share({ title: "Conversa SynastrIA", url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // User cancelled share dialog — ignore
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      title="Compartilhar conversa"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 10px",
        borderRadius: 8,
        border: "1px solid hsl(var(--border))",
        background: "transparent",
        color: "hsl(var(--muted-foreground))",
        fontSize: "0.72rem",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--foreground))";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--foreground) / 0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "hsl(var(--muted-foreground))";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(var(--border))";
      }}
    >
      {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
      {copied ? "Copiado!" : "Compartilhar"}
    </button>
  );
};

// ─── Chats page ────────────────────────────────────────────────────────────────

const Chats = () => {
  const navigate = useNavigate();
  const { conversationId: urlConvId } = useParams<{ conversationId: string }>();

  const token = sessionStorage.getItem("sof_token");
  const isGuest = !token;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(urlConvId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingStatus, setTypingStatus] = useState<"thinking" | "wikipedia">("thinking");
  const [selectedModel, setSelectedModel] = useState("syn-v1-free");
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [upgradeBanner, setUpgradeBanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);

  const imageAbortRef = useRef<AbortController | null>(null);

  const activeConvIdRef = useRef<string | null>(null);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  // Tracks a new conversation ID received during streaming — navigation is
  // deferred to after the stream ends so the useEffect that fetches conversation
  // history from the DB doesn't fire while the backend hasn't saved yet.
  const pendingConvIdRef = useRef<string | null>(null);

  // ── Sync active conversation with URL ──
  const setActiveConvAndNav = useCallback((id: string | null) => {
    setActiveConvId(id);
    if (id) {
      navigate(`/chats/${id}`, { replace: true });
    } else {
      navigate("/chats", { replace: true });
    }
  }, [navigate]);

  // ── On mount: load conversations and, if URL has an ID, load it ──
  useEffect(() => {
    if (!token) return;
    fetchConversations(token).then(setConversations).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token || !urlConvId) return;
    // Skip if we're actively streaming — the in-memory messages are the
    // source of truth during a stream. Navigation after the stream ends
    // will re-trigger this effect with data already saved to the DB.
    if (isLoading) return;
    fetchConversation(token, urlConvId)
      .then((data) => {
        setMessages(data.messages.map((m) => ({
          role: m.role,
          content: m.content,
          imageGenerated: m.role === "assistant" ? (m.image_url ?? undefined) : undefined,
        })));
        setActiveConvId(urlConvId);
      })
      .catch(() => {
        navigate("/chats", { replace: true });
      });
  // Re-executa sempre que o ID na URL mudar (ex: navegando via link compartilhado)
  }, [urlConvId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    sessionStorage.removeItem("sof_token");
    navigate("/login");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      setUpgradeBanner(true);
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setUpgradeBanner(false), 4000);
    }
  }, []);

  const handleNewConversation = () => {
    setActiveConvAndNav(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleSelectConversation = async (id: string) => {
    if (!token) return;
    setActiveConvAndNav(id);
    setSidebarOpen(false);
    try {
      const data = await fetchConversation(token, id);
      setMessages(data.messages.map((m) => ({
        role: m.role,
        content: m.content,
        imageGenerated: m.role === "assistant" ? (m.image_url ?? undefined) : undefined,
      })));
    } catch { setMessages([]); }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!token) return;
    try {
      await deleteConversation(token, id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvIdRef.current === id) {
        setActiveConvAndNav(null);
        setMessages([]);
      }
    } catch {}
  };

  const handleDeleteAll = async () => {
    if (!token) return;
    try {
      await deleteAllConversations(token);
      setConversations([]);
      setActiveConvAndNav(null);
      setMessages([]);
    } catch {}
  };

  const startImageGeneration = useCallback(async (
    text: string,
  ) => {
    setMessages((prev) => [...prev, { role: "assistant", content: "✦ Gerando sua imagem, aguarde...", modelSlug: selectedModel }]);
    setIsImageGenerating(true);

    const abort = new AbortController();
    imageAbortRef.current = abort;

    try {
      const result = await generateImage(token!, text, abort.signal, activeConvIdRef.current);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `✦ Prompt refinado: *${result.prompt_refined}*`,
          imageGenerated: result.image_url,
          modelSlug: selectedModel,
        };
        return updated;
      });
      if (result.conversation_id) {
        if (!activeConvIdRef.current) setActiveConvAndNav(result.conversation_id);
        fetchConversations(token!).then(setConversations).catch(() => {});
      }
      if (result.remaining_messages !== undefined) setRemainingMessages(result.remaining_messages);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: "Geração de imagem cancelada.", modelSlug: selectedModel };
          return updated;
        });
      } else {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: `Não consegui gerar a imagem. ${msg}`, modelSlug: selectedModel };
          return updated;
        });
      }
    } finally {
      setIsImageGenerating(false);
      imageAbortRef.current = null;
    }
  }, [token, selectedModel, setActiveConvAndNav]);

  const sendMessage = useCallback(async (
    text: string,
    fileBase64?: string,
    fileName?: string,
    fileMediaType?: string,
  ) => {
    const userMsg: Message = {
      role: "user",
      content: text || (fileName ? `📎 ${fileName}` : ""),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (isGuest) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: "Log in to use SynastrIA. In guest mode, chats are not saved.", modelSlug: selectedModel }]);
        setIsLoading(false);
      }, 600);
      return;
    }

    // ── Image generation ──
    if (isImageRequest(text)) {
      setIsLoading(false);
      await startImageGeneration(text);
      return;
    }

    // ── File Manager ──
    const isFileManager = text.trim().toLowerCase().startsWith("/file_manager");
    if (isFileManager) {
      const command = text.trim().replace(/^\/file_manager\s*/i, "").trim()
        || (fileName ? `Analyze and process the file: ${fileName}` : "Create a useful Python script");

      const initialSteps = [
        { id: "classifying", label: "Analyzing request",  status: "running" as const },
        { id: "generating",  label: "Generating code",    status: "pending" as const },
        { id: "executing",   label: "Checking syntax",    status: "pending" as const },
        { id: "uploading",   label: "Saving result",      status: "pending" as const },
      ];

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "🖥️ Running on CLI...",
        sandboxSteps: initialSteps,
        modelSlug: selectedModel,
      }]);

      const updateSteps = (updater: (steps: import("@/components/SandboxProgress").SandboxStep[]) => import("@/components/SandboxProgress").SandboxStep[]) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant" && last.sandboxSteps) {
            updated[updated.length - 1] = { ...last, sandboxSteps: updater(last.sandboxSteps!) };
          }
          return updated;
        });
      };

      try {
        const result = await sendSandboxMessage(
          token!,
          command,
          fileBase64,
          fileName,
          fileMediaType,
          (status, _msg, detail) => {
            updateSteps((steps) => steps.map((s) => {
              if (status === "classifying" && s.id === "classifying") return { ...s, status: "running" };
              if (status === "planned" && s.id === "classifying") return { ...s, status: "done" };
              if (status === "generating" && s.id === "generating") return { ...s, status: "running", attempt: detail?.attempt };
              if (status === "code_generated" && s.id === "generating") return { ...s, status: "done", detail: detail?.code, isCode: true, attempt: detail?.attempt };
              if (status === "executing" && s.id === "executing") return { ...s, status: "running", attempt: detail?.attempt };
              if (status === "exec_error" && s.id === "executing") return { ...s, status: detail?.retrying ? "retrying" : "error", detail: detail?.error, attempt: detail?.attempt };
              if (status === "uploading" && s.id === "uploading") return { ...s, status: "running" };
              return s;
            }));
          },
        );

        updateSteps((steps) => steps.map((s) =>
          s.status === "pending" || s.status === "running" ? { ...s, status: "done" as const } : s
        ));

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            const codeTypes = ["html", "css", "js", "ts", "py", "md", "sh", "sql", "yaml", "json", "txt"];
            const fn = result.output_type === "html"
              ? "index.html"
              : `${result.title.toLowerCase().replace(/\s+/g, "-")}.${result.output_type}`;
            const githubFiles = result.github_files
              ?? (codeTypes.includes(result.output_type) && result.file_content ? { [fn]: result.file_content } : undefined);

            updated[updated.length - 1] = {
              ...last,
              content: result.output_type === "html"
                ? `✅ Done! **${result.title}** — published on synastria.dev`
                : `✅ Done! **${result.title}**`,
              sandboxOutputUrl: result.output_url,
              sandboxOutputType: result.output_type,
              sandboxTitle: result.title,
              sandboxPublicUrl: result.public_url,
              sandboxGithubFiles: githubFiles,
            };
          }
          return updated;
        });

        if (result.remaining_messages !== undefined) setRemainingMessages(result.remaining_messages);
      } catch (err) {
        updateSteps((steps) => steps.map((s) =>
          s.status === "running" ? { ...s, status: "error" as const } : s
        ));
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: `❌ ${err instanceof Error ? err.message : "CLI error."}` };
          }
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Normal chat ──
    setTypingStatus(isFactualMessage(text) ? "wikipedia" : "thinking");
    setMessages((prev) => [...prev, { role: "assistant", content: "", modelSlug: selectedModel }]);

    try {
      const response = await sendChatMessage(
        token!, text, activeConvIdRef.current,
        (delta) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + delta };
            }
            return updated;
          });
        },
        (meta) => {
          if (meta.conversation_id && !activeConvIdRef.current) {
            // Update the ref so subsequent messages in this stream go to
            // the right conversation — but DON'T navigate yet.
            // Navigation triggers the urlConvId useEffect which would fetch
            // from DB (empty while backend is still streaming).
            activeConvIdRef.current = meta.conversation_id;
            pendingConvIdRef.current = meta.conversation_id;
          }
          if (meta.remaining_messages !== undefined) setRemainingMessages(meta.remaining_messages);
        },
        fileBase64,
        fileName,
        fileMediaType,
        selectedModel,
        // ── Agent tool call: add badge to last assistant message ──
        (evt) => {
          const newCall: AgentToolCallEntry = {
            tool: evt.tool as AgentToolCallEntry["tool"],
            args: evt.args,
            status: "running",
          };
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                agentToolCalls: [...(last.agentToolCalls ?? []), newCall],
              };
            }
            return updated;
          });
        },
        // ── Agent tool result: mark badge done + parse file/image results ──
        (evt) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (!last || last.role !== "assistant") return prev;

            // Mark the matching running call as done
            const agentToolCalls = (last.agentToolCalls ?? []).map((tc) =>
              tc.tool === evt.tool && tc.status === "running"
                ? { ...tc, status: "done" as const, summary: evt.summary }
                : tc
            );

            let agentFileResult = last.agentFileResult;
            let agentImageUrl = last.agentImageUrl;

            // Parse sandbox file URL from summary text
            if (evt.tool === "run_sandbox") {
              const urlMatch = evt.summary.match(/URL para download:\s*(https?:\/\/\S+)/);
              const publicMatch = evt.summary.match(/URL pública[^:]*:\s*(https?:\/\/\S+)/);
              const titleMatch = evt.summary.match(/Título:\s*(.+)/);
              const typeMatch = evt.summary.match(/Tipo:\s*(\S+)/);
              if (urlMatch) {
                const codeTypes = ["html", "css", "js", "ts", "py", "md", "sh", "sql", "yaml", "json", "txt"];
                const outputType = (typeMatch?.[1] ?? "txt").toLowerCase();
                const fn = outputType === "html"
                  ? "index.html"
                  : `${(titleMatch?.[1] ?? "arquivo").toLowerCase().replace(/\s+/g, "-")}.${outputType}`;
                const githubFiles = codeTypes.includes(outputType)
                  ? { [fn]: "" } // conteúdo real vem no full_reply se necessário
                  : undefined;
                agentFileResult = {
                  outputUrl: urlMatch[1],
                  outputType,
                  title: titleMatch?.[1] ?? "Arquivo",
                  publicUrl: publicMatch?.[1],
                  githubFiles,
                };
              }
            }

            // Parse image URL from generate_image summary
            if (evt.tool === "generate_image") {
              const urlMatch = evt.summary.match(/URL:\s*(https?:\/\/\S+)/);
              if (urlMatch) agentImageUrl = urlMatch[1];
            }

            updated[updated.length - 1] = {
              ...last,
              agentToolCalls,
              agentFileResult,
              agentImageUrl,
            };
            return updated;
          });
        },
      );

      if (response.thinking || response.ttft_ms !== undefined) {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              ...(response.thinking ? { thinking: response.thinking } : {}),
              ...(response.ttft_ms !== undefined ? { ttft_ms: response.ttft_ms } : {}),
            };
          }
          return updated;
        });
      }
    } catch (err) {
        // Se deu erro no stream, não devemos navegar para uma conversa que pode estar incompleta no DB
        pendingConvIdRef.current = null;

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            updated[updated.length - 1] = { ...last, content: `❌ ${err instanceof Error ? err.message : "Sorry, an error occurred. Please try again."}` };
          }
          return updated;
        });
      } finally {
        // Navigate to the new conversation NOW (after DB has the messages saved)
        if (pendingConvIdRef.current) {
          setActiveConvAndNav(pendingConvIdRef.current);
          fetchConversations(token!).then(setConversations).catch(() => {});
          pendingConvIdRef.current = null;
        }
        setIsLoading(false);
        setTypingStatus("thinking");
      }
  }, [token, isGuest, selectedModel, startImageGeneration, setActiveConvAndNav]);

  const hasMessages = messages.length > 0;

  return (
    <div className="app-shell">
      {upgradeBanner && (
        <div className="upgrade-banner">
          <div className="upgrade-banner-inner">Pro plan activated! Log in again to apply the upgrade.</div>
        </div>
      )}

      {!isGuest && (
        <ChatHistory
          conversations={conversations}
          activeId={activeConvId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
          onDeleteAll={handleDeleteAll}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onLogout={handleLogout}
        remainingMessages={remainingMessages}
        onSidebarToggle={!isGuest ? () => setSidebarOpen(true) : undefined}
        isGuest={isGuest}
      />

      {/* Share button — visible when there's an active conversation */}
      {hasMessages && activeConvId && (
        <div
          style={{
            position: "fixed",
            top: 60,
            right: 16,
            zIndex: 40,
          }}
        >
          <ShareButton conversationId={activeConvId} />
        </div>
      )}

      <HeroView visible={!hasMessages} />
      {hasMessages && (
        <ChatView
          messages={messages}
          isLoading={isLoading}
          typingStatus={typingStatus}
          selectedModel={selectedModel}
        />
      )}

      {isImageGenerating && (
        <div className="image-gen-banner">
          <span>Generating image...</span>
          <button onClick={() => { imageAbortRef.current?.abort(); }} className="image-gen-cancel">
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      )}



      <InputBar onSend={sendMessage} disabled={isLoading || isImageGenerating} conversationId={activeConvId} />
    </div>
  );
};

export default Chats;
