import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import HeroView from "@/components/HeroView";
import ChatView, { type Message } from "@/components/ChatView";
import InputBar from "@/components/InputBar";
import LoginScreen from "@/components/LoginScreen";
import RegisterScreen from "@/components/RegisterScreen";
import ChatHistory, { type Conversation } from "@/components/ChatHistory";
import { Menu } from "lucide-react";

const API_URL = "https://sofia-api-z8nr.onrender.com";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function titleFromMessage(msg: string) {
  return msg.length > 40 ? msg.slice(0, 40) + "…" : msg;
}

const Index = () => {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem("sof_token")
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("sof-v1-free");
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");
  const [upgradeBanner, setUpgradeBanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;
  const messages = activeConv?.messages ?? [];

  const handleLogout = () => {
    setToken(null);
    setConversations([]);
    setActiveConvId(null);
    setRemainingMessages(null);
  };

  const handleLogin = useCallback((t: string) => setToken(t), []);

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
    setSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = { role: "user", content: text };
      setIsLoading(true);

      let convId = activeConvId;

      if (!convId) {
        // Create new conversation
        convId = generateId();
        const newConv: Conversation = {
          id: convId,
          title: titleFromMessage(text),
          messages: [userMsg],
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(convId);
      } else {
        // Add to existing
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c
          )
        );
      }

      const currentMessages = activeConv ? [...activeConv.messages, userMsg] : [userMsg];
      const history = currentMessages.map(({ role, content }) => ({ role, content }));

      try {
        const res = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text, history }),
        });

        if (!res.ok) throw new Error("Erro na resposta");

        const data = await res.json();
        const reply = data.reply ?? "";
        const assistantMsg: Message = { role: "assistant", content: reply };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, messages: [...c.messages, assistantMsg] } : c
          )
        );

        if (data.remaining_messages !== undefined) {
          setRemainingMessages(data.remaining_messages);
        }
      } catch {
        const errorMsg: Message = {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente.",
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, messages: [...c.messages, errorMsg] } : c
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeConvId, activeConv, token]
  );

  if (!token) {
    return authScreen === "login" ? (
      <LoginScreen onLogin={handleLogin} onSwitchToRegister={() => setAuthScreen("register")} />
    ) : (
      <RegisterScreen onLogin={handleLogin} onSwitchToLogin={() => setAuthScreen("login")} />
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {upgradeBanner && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center pt-3 px-4">
          <div className="input-surface rounded-xl px-4 py-2.5 text-sm text-foreground">
            Plano pro ativado! Faca login novamente para atualizar.
          </div>
        </div>
      )}

      <ChatHistory
        conversations={conversations}
        activeId={activeConvId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-12 left-5 z-30 p-2 rounded-xl hover:bg-accent transition-colors text-foreground/60 hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onLogout={handleLogout}
        remainingMessages={remainingMessages}
      />

      <HeroView visible={!hasMessages} />

      {hasMessages && <ChatView messages={messages} isLoading={isLoading} />}

      <InputBar onSend={sendMessage} disabled={isLoading} />
    </div>
  );
};

export default Index;
