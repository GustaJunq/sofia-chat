import { useState, useCallback } from "react";
import Header from "@/components/Header";
import HeroView from "@/components/HeroView";
import ChatView, { type Message } from "@/components/ChatView";
import InputBar from "@/components/InputBar";
import LoginScreen from "@/components/LoginScreen";

const API_URL = import.meta.env.VITE_API_URL || "";

const Index = () => {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("sof_token")
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("sof-v1-free");
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);

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
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
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
    return <LoginScreen onLogin={handleLogin} />;
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        remainingMessages={remainingMessages}
      />

      <HeroView visible={!hasMessages} />

      {hasMessages && <ChatView messages={messages} isLoading={isLoading} />}

      <InputBar onSend={sendMessage} disabled={isLoading} />
    </div>
  );
};

export default Index;
