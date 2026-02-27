import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import HeroView from "@/components/HeroView";
import ChatView, { type Message } from "@/components/ChatView";
import InputBar from "@/components/InputBar";
import LoginScreen from "@/components/LoginScreen";
import RegisterScreen from "@/components/RegisterScreen";

const API_URL = "https://sofia-api-z8nr.onrender.com";

const Index = () => {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem("sof_token")
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("sof-v1-free");
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");
  const [upgradeBanner, setUpgradeBanner] = useState(false);

  const handleLogout = () => {
    setToken(null);
    setMessages([]);
    setRemainingMessages(null);
  };
  const handleLogin = useCallback((t: string) => setToken(t), []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const history = [...messages, userMsg].map(({ role, content }) => ({
        role,
        content,
      }));

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

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

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
    [messages, token]
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
