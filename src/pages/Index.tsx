import { useState, useCallback, useEffect, useRef } from "react";
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
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      setUpgradeBanner(true);
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setUpgradeBanner(false), 4000);
    }
  }, []);

  const handleLogin = useCallback((t: string) => setToken(t), []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Placeholder para a resposta do assistente (streaming)
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const history = [...messages, userMsg].map(({ role, content }) => ({
        role,
        content,
      }));

      abortRef.current = new AbortController();

      try {
        const res = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: text, history }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error("Erro na resposta");

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (!json || json === "[DONE]") continue;

            try {
              const parsed = JSON.parse(json);

              if (parsed.error) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." };
                  return updated;
                });
                break;
              }

              if (parsed.token) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: updated[updated.length - 1].content + parsed.token,
                  };
                  return updated;
                });
              }

              if (parsed.done && parsed.remaining_messages !== undefined) {
                setRemainingMessages(parsed.remaining_messages);
              }
            } catch {
              continue;
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." };
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
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
        remainingMessages={remainingMessages}
      />

      <HeroView visible={!hasMessages} />

      {hasMessages && <ChatView messages={messages} isLoading={isLoading} />}

      <InputBar onSend={sendMessage} disabled={isLoading} />
    </div>
  );
};

export default Index;
                    
