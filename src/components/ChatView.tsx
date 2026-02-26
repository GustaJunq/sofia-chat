import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatView = ({ messages, isLoading }: ChatViewProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Mostra o TypingIndicator apenas se a ultima mensagem do assistente ainda estiver vazia
  const lastMsg = messages[messages.length - 1];
  const showTyping = isLoading && lastMsg?.role === "assistant" && lastMsg?.content === "";

  return (
    <div className="flex-1 overflow-y-auto pt-24 pb-40 px-5">
      <div className="max-w-[640px] mx-auto">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatView;
