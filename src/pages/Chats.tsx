import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HeroView from "@/components/HeroView";
import ChatView, { type Message } from "@/components/ChatView";
import InputBar from "@/components/InputBar";
import ChatHistory from "@/components/ChatHistory";
import { Menu, X } from "lucide-react";
import {
  fetchConversations,
  fetchConversation,
  sendChatMessage,
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
  "cria uma imagem", "cria imagem", "criar imagem", "criar uma imagem",
  "desenha", "desenhe", "faz uma imagem", "faz uma foto",
  "generate image", "generate a image", "generate an image",
  "create image", "draw", "make an image", "make a picture",
  "ilustra", "ilustre", "imagina", "visualiza",
];

function isImageRequest(text: string): boolean {
  const lower = text.toLowerCase();
  return IMAGE_TRIGGER_WORDS.some((trigger) => lower.includes(trigger));
}

function isFactualMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return RAG_TRIGGER_WORDS.some((trigger) => lower.includes(trigger));
}

const Chats = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("sof_token");
  const isGuest = !token;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [typingStatus, setTypingStatus] = useState<"thinking" | "wikipedia">("thinking");
  const [selectedModel, setSelectedModel] = useState("sof-v1-free");
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [upgradeBanner, setUpgradeBanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeConvIdRef = useRef<string | null>(null);
  const imageAbortRef = useRef<AbortController | null>(null);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  useEffect(() => {
    if (!token) return;
    fetchConversations(token).then(setConversations).catch(() => {});
  }, [token]);

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

  const handleNewConversation = () => { setActiveConvId(null); setMessages([]); setSidebarOpen(false); };

  const handleSelectConversation = async (id: string) => {
    if (!token) return;
    setActiveConvId(id);
    setSidebarOpen(false);
    try {
      const data = await fetchConversation(token, id);
      setMessages(data.messages.map((m) => ({ role: m.role, content: m.content, imagePreview: m.image_url ?? undefined })));
    } catch { setMessages([]); }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!token) return;
    try {
      await deleteConversation(token, id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvIdRef.current === id) { setActiveConvId(null); setMessages([]); }
    } catch {}
  };

  const handleDeleteAll = async () => {
    if (!token) return;
    try {
      await deleteAllConversations(token);
      setConversations([]);
      setActiveConvId(null);
      setMessages([]);
    } catch {}
  };

  const sendMessage = useCallback(async (text: string, imageBase64?: string, imageMediaType?: string) => {
    const userMsg: Message = { role: "user", content: text, imagePreview: imageBase64 ? `data:${imageMediaType ?? "image/jpeg"};base64,${imageBase64}` : undefined };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (isGuest) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: "Faça login para usar a sofIA. No modo visitante, o chat não é salvo." }]);
        setIsLoading(false);
      }, 600);
      return;
    }

    // ── Fluxo de geração de imagem ─────────────────────────────────────────
    if (!imageBase64 && isImageRequest(text)) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Gerando sua imagem..." }]);
      setIsLoading(false); // libera o chat normal
      setIsImageGenerating(true);

      const abort = new AbortController();
      imageAbortRef.current = abort;

      try {
        const result = await generateImage(token!, text, abort.signal);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `✦ Prompt refinado: *${result.prompt_refined}*`,
            imageGenerated: result.image_url,
          };
          return updated;
        });
        if (result.remaining_messages !== undefined) setRemainingMessages(result.remaining_messages);
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: "Geração de imagem cancelada." };
            return updated;
          });
        } else {
          const msg = err instanceof Error ? err.message : "Erro ao gerar imagem";
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: `Desculpe, não consegui gerar a imagem. ${msg}` };
            return updated;
          });
        }
      } finally {
        setIsImageGenerating(false);
        imageAbortRef.current = null;
        setTypingStatus("thinking");
      }
      return;
    }

    // ── Fluxo de chat normal ───────────────────────────────────────────────
    setTypingStatus(isFactualMessage(text) ? "wikipedia" : "thinking");
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await sendChatMessage(token!, text, activeConvIdRef.current,
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
            setActiveConvId(meta.conversation_id);
            fetchConversations(token!).then(setConversations).catch(() => {});
          }
          if (meta.remaining_messages !== undefined) setRemainingMessages(meta.remaining_messages);
        },
        imageBase64,
        imageMediaType,
      );

      if (response.thinking) {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, thinking: response.thinking };
          }
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          updated[updated.length - 1] = { ...last, content: "Desculpe, ocorreu um erro. Tente novamente." };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      setTypingStatus("thinking");
    }
  }, [token, isGuest]);

  const hasMessages = messages.length > 0;

  return (
    <div className="app-shell">
      {upgradeBanner && (
        <div className="upgrade-banner">
          <div className="upgrade-banner-inner">Plano pro ativado! Faça login novamente para atualizar.</div>
        </div>
      )}

      {!isGuest && (
        <ChatHistory conversations={conversations} activeId={activeConvId}
          onSelect={handleSelectConversation} onNew={handleNewConversation}
          onDelete={handleDeleteConversation} onDeleteAll={handleDeleteAll}
          open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {!isGuest && (
        <button onClick={() => setSidebarOpen(true)} className="sidebar-toggle">
          <Menu className="w-5 h-5" />
        </button>
      )}

      <Header selectedModel={selectedModel} onModelChange={setSelectedModel}
        onLogout={handleLogout} remainingMessages={remainingMessages} />

      <HeroView visible={!hasMessages} />
      {hasMessages && <ChatView messages={messages} isLoading={isLoading} typingStatus={typingStatus} />}

      {isImageGenerating && (
        <div className="image-gen-banner">
          <span>Gerando imagem...</span>
          <button
            onClick={() => { imageAbortRef.current?.abort(); }}
            className="image-gen-cancel"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      )}

      <InputBar onSend={sendMessage} disabled={isLoading || isImageGenerating} conversationId={activeConvId} />
    </div>
  );
};

export default Chats;
