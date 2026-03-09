import { useState, useCallback, useEffect, useRef } from "react";
import Header from "@/components/Header";
import HeroView from "@/components/HeroView";
import ChatView, { type Message } from "@/components/ChatView";
import InputBar from "@/components/InputBar";
import LoginScreen from "@/components/LoginScreen";
import RegisterScreen from "@/components/RegisterScreen";
import ChatHistory from "@/components/ChatHistory";
import { Menu } from "lucide-react";
import {
  fetchConversations,
  fetchConversation,
  sendChatMessage,
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

function isFactualMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return RAG_TRIGGER_WORDS.some((trigger) => lower.includes(trigger));
}

const Index = () => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("sof_token"));
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingStatus, setTypingStatus] = useState<"thinking" | "wikipedia">("thinking");
  const [selectedModel, setSelectedModel] = useState("sof-v1-free");
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");
  const [upgradeBanner, setUpgradeBanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const activeConvIdRef = useRef<string | null>(null);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  useEffect(() => {
    if (!token) return;
    fetchConversations(token).then(setConversations).catch(() => {});
  }, [token]);

  const handleLogout = () => {
    sessionStorage.removeItem("sof_token");
    setToken(null);
    setConversations([]);
    setActiveConvId(null);
    setMessages([]);
    setRemainingMessages(null);
    setIsGuest(false);
  };

  const handleLogin = useCallback((t: string) => { setIsGuest(false); setToken(t); }, []);
  const handleSkipAuth = useCallback(() => { setIsGuest(true); }, []);

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
    setTypingStatus(isFactualMessage(text) ? "wikipedia" : "thinking");
    setIsLoading(true);

    if (isGuest) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: "Faça login para usar a sofIA. No modo visitante, o chat não é salvo." }]);
        setIsLoading(false);
      }, 600);
      return;
    }

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

  if (!token && !isGuest) {
    return authScreen === "login" ? (
      <LoginScreen onLogin={handleLogin} onSwitchToRegister={() => setAuthScreen("register")} onSkip={handleSkipAuth} />
    ) : (
      <RegisterScreen onLogin={handleLogin} onSwitchToLogin={() => setAuthScreen("login")} onSkip={handleSkipAuth} />
    );
  }

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
      <InputBar
        onSend={sendMessage}
        disabled={isLoading}
        conversationId={activeConvId}
        onVoiceResponse={(userText, assistantText, convId, _audioBase64) => {
          setMessages((prev) => [
            ...prev,
            { role: "user", content: userText },
            { role: "assistant", content: assistantText },
          ]);
          if (convId && !activeConvIdRef.current) {
            setActiveConvId(convId);
            if (token) fetchConversations(token).then(setConversations).catch(() => {});
          }
        }}
      />
    </div>
  );
};

export default Index;
