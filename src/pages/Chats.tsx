import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HeroView from "@/components/HeroView";
import ChatView, { type Message } from "@/components/ChatView";
import InputBar from "@/components/InputBar";
import ChatHistory from "@/components/ChatHistory";
import { X, Key } from "lucide-react";
import {
  fetchConversations,
  fetchConversation,
  sendChatMessage,
  generateImage,
  getOpenRouterKey,
  saveOpenRouterKey,
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

const Chats = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("sof_token");
  const isGuest = !token;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingStatus, setTypingStatus] = useState<"thinking" | "wikipedia">("thinking");
  const [selectedModel, setSelectedModel] = useState("syn-v1-free");
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [upgradeBanner, setUpgradeBanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [pendingImageText, setPendingImageText] = useState<string | null>(null);
  const imageAbortRef = useRef<AbortController | null>(null);

  const activeConvIdRef = useRef<string | null>(null);
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
      setMessages(data.messages.map((m) => ({
        role: m.role,
        content: m.content,
        // Imagens enviadas pelo usuário ficam em imagePreview
        // Imagens geradas pela IA (FLUX) ficam em imageGenerated
        imagePreview: m.role === 'user' ? (m.image_url ?? undefined) : undefined,
        imageGenerated: m.role === 'assistant' ? (m.image_url ?? undefined) : undefined,
      })));
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


  const startImageGeneration = useCallback(async (text: string, orKey: string, imageBase64?: string, imageMediaType?: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content: "✦ Gerando sua imagem, aguarde..." }]);
    setIsImageGenerating(true);

    const abort = new AbortController();
    imageAbortRef.current = abort;

    try {
      const referenceImage = imageBase64 ? `data:${imageMediaType ?? "image/jpeg"};base64,${imageBase64}` : undefined;
      const result = await generateImage(token!, text, orKey, abort.signal, activeConvIdRef.current, referenceImage);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `✦ Prompt refinado: *${result.prompt_refined}*`,
          imageGenerated: result.image_url,
        };
        return updated;
      });
      if (result.conversation_id) {
        if (!activeConvIdRef.current) setActiveConvId(result.conversation_id);
        fetchConversations(token!).then(setConversations).catch(() => {});
      }
      if (result.remaining_messages !== undefined) setRemainingMessages(result.remaining_messages);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: "Geração de imagem cancelada." };
          return updated;
        });
      } else {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        // Se a chave for inválida, remove do localStorage
        if (msg.includes("401") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("unauthorized")) {
          localStorage.removeItem("sof_openrouter_key");
        }
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: `Não consegui gerar a imagem. ${msg}` };
          return updated;
        });
      }
    } finally {
      setIsImageGenerating(false);
      imageAbortRef.current = null;
    }
  }, [token]);

  const sendMessage = useCallback(async (text: string, imageBase64?: string, imageMediaType?: string) => {
    const userMsg: Message = { role: "user", content: text, imagePreview: imageBase64 ? `data:${imageMediaType ?? "image/jpeg"};base64,${imageBase64}` : undefined };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (isGuest) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: "Faça login para usar a SynastrIA. No modo visitante, o chat não é salvo." }]);
        setIsLoading(false);
      }, 600);
      return;
    }

    // ── Fluxo de geração de imagem ─────────────────────────────────────────
    if (isImageRequest(text)) {
      setIsLoading(false);
      const orKey = getOpenRouterKey();
      if (!orKey) {
        // Não tem chave — pede pro usuário
        setPendingImageText(text);
        setShowKeyModal(true);
        return;
      }
      await startImageGeneration(text, orKey, imageBase64, imageMediaType);
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

      <Header selectedModel={selectedModel} onModelChange={setSelectedModel}
        onLogout={handleLogout} remainingMessages={remainingMessages}
        onSidebarToggle={!isGuest ? () => setSidebarOpen(true) : undefined}
        isGuest={isGuest} />

      <HeroView visible={!hasMessages} />
      {hasMessages && <ChatView messages={messages} isLoading={isLoading} typingStatus={typingStatus} />}


      {isImageGenerating && (
        <div className="image-gen-banner">
          <span>Gerando imagem...</span>
          <button onClick={() => { imageAbortRef.current?.abort(); }} className="image-gen-cancel">
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white font-semibold text-lg">
              <Key className="w-5 h-5 text-orange-400" />
              Chave do OpenRouter
            </div>
            <p className="text-white/60 text-sm">
              Para gerar imagens, cole sua chave da API do{" "}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">
                OpenRouter
              </a>
              . Ela fica salva só no seu navegador.
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && keyInput.trim()) {
                  saveOpenRouterKey(keyInput);
                  setShowKeyModal(false);
                  if (pendingImageText) {
                    startImageGeneration(pendingImageText, keyInput.trim());
                    setPendingImageText(null);
                  }
                  setKeyInput("");
                }
              }}
              placeholder="sk-or-..."
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-orange-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowKeyModal(false); setPendingImageText(null); setKeyInput(""); }}
                className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!keyInput.trim()) return;
                  saveOpenRouterKey(keyInput);
                  setShowKeyModal(false);
                  if (pendingImageText) {
                    startImageGeneration(pendingImageText, keyInput.trim());
                    setPendingImageText(null);
                  }
                  setKeyInput("");
                }}
                className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
              >
                Salvar e gerar
              </button>
            </div>
          </div>
        </div>
      )}

      <InputBar onSend={sendMessage} disabled={isLoading || isImageGenerating} conversationId={activeConvId} />
    </div>
  );
};

export default Chats;
