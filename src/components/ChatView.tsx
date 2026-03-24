import { useEffect, useRef, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import SandboxProgress, { type SandboxStep } from "./SandboxProgress";
import AgentToolCallsBar, { type AgentToolCallEntry } from "./AgentToolCallsBar";

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
  sandboxPublicUrl?: string;
  sandboxGithubFiles?: Record<string, string>;
  /** Which model slug generated this assistant message */
  modelSlug?: string;
  /** Tool calls made autonomously by the agent during normal /chat */
  agentToolCalls?: AgentToolCallEntry[];
  /** File produced by the agent's run_sandbox tool call */
  agentFileResult?: {
    outputUrl: string;
    outputType: string;
    title: string;
    publicUrl?: string;
    githubFiles?: Record<string, string>;
  };
  /** Image produced by the agent's generate_image tool call */
  agentImageUrl?: string;
}

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  typingStatus?: "thinking" | "wikipedia";
  /** Currently selected model slug — used for the typing indicator avatar */
  selectedModel?: string;
}

const ChatView = ({ messages, isLoading, typingStatus = "thinking", selectedModel }: ChatViewProps) => {
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
            {/* Agent tool calls bar — shown above the assistant bubble */}
            {msg.role === "assistant" && msg.agentToolCalls && msg.agentToolCalls.length > 0 && (
              <AgentToolCallsBar toolCalls={msg.agentToolCalls} />
            )}

            <MessageBubble
              role={msg.role}
              content={msg.content}
              thinking={msg.thinking}
              imagePreview={msg.imagePreview}
              imageGenerated={msg.imageGenerated ?? msg.agentImageUrl}
              onPlayRequest={msg.role === "assistant" ? handlePlayRequest : undefined}
              modelSlug={msg.role === "assistant" ? (msg.modelSlug ?? selectedModel) : undefined}
            />

            {/* /file_manager sandbox progress */}
            {msg.sandboxSteps && msg.sandboxSteps.length > 0 && (
              <div className="sandbox-progress-wrapper">
                <SandboxProgress
                  steps={msg.sandboxSteps}
                  outputUrl={msg.sandboxOutputUrl}
                  outputType={msg.sandboxOutputType}
                  title={msg.sandboxTitle}
                  publicUrl={msg.sandboxPublicUrl}
                  githubFiles={msg.sandboxGithubFiles}
                />
              </div>
            )}

            {/* Agent autonomous sandbox result */}
            {msg.role === "assistant" && msg.agentFileResult && (
              <div className="sandbox-progress-wrapper">
                <SandboxProgress
                  steps={[{ id: "done", label: "Arquivo gerado pelo agente", status: "done" }]}
                  outputUrl={msg.agentFileResult.outputUrl}
                  outputType={msg.agentFileResult.outputType}
                  title={msg.agentFileResult.title}
                  publicUrl={msg.agentFileResult.publicUrl}
                  githubFiles={msg.agentFileResult.githubFiles}
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
