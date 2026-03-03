import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import HeroView from "@/components/HeroView";
import ChatView, { type Message } from "@/components/ChatView";
import InputBar from "@/components/InputBar";
import LoginScreen from "@/components/LoginScreen";
import RegisterScreen from "@/components/RegisterScreen";
import ChatHistory from "@/components/ChatHistory";
import { Menu } from "lucide-react";
import {
  API_URL,
  fetchConversations,
  fetchConversation,
  sendChatMessage,
  deleteConversation,
  deleteAllConversations,
  type ConversationSummary,
} from "@/lib/api";

const Index = () => {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem("sof_token")
  );
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("sof-v1-free");
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");
  const [upgradeBanner, setUpgradeBanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // Load conversation list when logged in
  useEffect(() => {
    if (!token) return;
    fetchConversations(token)
      .then(setConversations)
      .catch(() => {});
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

  const handleLogin = useCallback((t: string) => {
    setIsGuest(false);
    setToken(t);
  }, []);

  const handleSkipAuth = useCallback(() => {
    setIsGuest(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      setUpgradeBanner(true);
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setUpgradeBanner(false), 4000);
    }
  }, []);

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleSelectConversation = async (id: string) => {
    if (!token) return;
    setActiveConvId(id);
    setSidebarOpen(false);
    try {
      const data = await fetchConversation(token, id);
      setMessages(
        data.messages.map((m) => ({ role: m.role, content: m.content }))
      );
    } catch {
      setMessages([]);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!token) return;
    try {
      await deleteConversation(token, id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
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

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      if (isGuest) {
        try {
          const res = await fetch(`${API_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
          });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "" }]);
          if (data.remaining_messages !== undefined) setRemainingMessages(data.remaining_messages);
        } catch {
          setMessages((prev) => [...prev, { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." }]);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await sendChatMessage(token!, text, activeConvId);
        const assistantMsg: Message = { role: "assistant", content: data.reply ?? "" };
        setMessages((prev) => [...prev, assistantMsg]);

        // If new conversation was created, update state
        if (!activeConvId && data.conversation_id) {
          setActiveConvId(data.conversation_id);
          // Refresh conversation list
          fetchConversations(token!).then(setConversations).catch(() => {});
        }

        if (data.remaining_messages !== undefined) {
          setRemainingMessages(data.remaining_messages);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConvId, token, isGuest]
  );

  if (!token && !isGuest) {
    return authScreen === "login" ? (
      <LoginScreen
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthScreen("register")}
        onSkip={handleSkipAuth}
      />
    ) : (
      <RegisterScreen
        onLogin={handleLogin}
        onSwitchToLogin={() => setAuthScreen("login")}
        onSkip={handleSkipAuth}
      />
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {upgradeBanner && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center pt-3 px-4">
          <div className="input-surface rounded-xl px-4 py-2.5 text-sm text-foreground">
            Plano pro ativado! Faça login novamente para atualizar.
          </div>
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

      {!isGuest && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-12 left-5 z-30 p-2 rounded-xl hover:bg-accent transition-colors text-foreground/60 hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onLogout={isGuest ? handleLogout : handleLogout}
        remainingMessages={remainingMessages}
      />

      <HeroView visible={!hasMessages} />

      {hasMessages && <ChatView messages={messages} isLoading={isLoading} />}

      <InputBar onSend={sendMessage} disabled={isLoading} />
    </div>
  );
};

export default Index;
