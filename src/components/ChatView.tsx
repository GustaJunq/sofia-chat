import { useEffect, useRef, useCallback } from "react";
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
  const currentPauseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handlePlayRequest = useCallback(
    async (play: () => Promise<void>, pause: () => void) => {
      // Stop any currently playing audio
      currentPauseRef.current?.();
      currentPauseRef.current = pause;
      await play();
    },
    []
  );

  return (
    <div className="flex-1 overflow-y-auto pt-24 pb-40 px-5">
      <div className="max-w-[640px] mx-auto">
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            onPlayRequest={msg.role === "assistant" ? handlePlayRequest : undefined}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatView;
