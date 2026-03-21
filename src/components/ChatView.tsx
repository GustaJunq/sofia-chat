import { useEffect, useRef, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import SandboxProgress, { type SandboxStep } from "./SandboxProgress";

export interface Message {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  imagePreview?: string;
  imageGenerated?: string;
  sandboxSteps?: SandboxStep[];
  sandboxOutputUrl?: string;
  sandboxOutputType?: string;
  sandboxTitle?: string;
}

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  typingStatus?: "thinking" | "wikipedia";
}

const ChatView = ({ messages, isLoading, typingStatus = "thinking" }: ChatViewProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentPauseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handlePlayRequest = useCallback(
    async (play: () => Promise<void>, pause: () => void) => {
      currentPauseRef.current?.();
      currentPauseRef.current = pause;
      await play();
    },
    []
  );

  return (
    <div className="chat-scroll">
      <div className="chat-container">
        {messages.map((msg, i) => (
          <div key={i}>
            <MessageBubble
              role={msg.role}
              content={msg.content}
              thinking={msg.thinking}
              imagePreview={msg.imagePreview}
              imageGenerated={msg.imageGenerated}
              onPlayRequest={msg.role === "assistant" ? handlePlayRequest : undefined}
            />
            {msg.sandboxSteps && msg.sandboxSteps.length > 0 && (
              <div className="sandbox-progress-wrapper">
                <SandboxProgress
                  steps={msg.sandboxSteps}
                  outputUrl={msg.sandboxOutputUrl}
                  outputType={msg.sandboxOutputType}
                  title={msg.sandboxTitle}
                />
              </div>
            )}
          </div>
        ))}
        {isLoading && <TypingIndicator status={typingStatus} />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatView;
