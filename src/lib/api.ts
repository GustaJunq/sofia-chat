export const API_URL = "https://api.synastria.dev";

export function getToken(): string | null {
  return sessionStorage.getItem("sof_token");
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  created_at: string;
}

export interface ConversationDetail {
  conversation_id: string;
  title: string;
  messages: MessageData[];
}

export async function fetchConversations(token: string): Promise<ConversationSummary[]> {
  const res = await fetch(`${API_URL}/history`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Erro ao buscar histórico");
  const data = await res.json();
  return data.conversations ?? [];
}

export async function fetchConversation(token: string, id: string): Promise<ConversationDetail> {
  const res = await fetch(`${API_URL}/history/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Erro ao carregar conversa");
  return res.json();
}

export async function deleteConversation(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/history/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Erro ao apagar conversa");
}

export async function deleteAllConversations(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/history`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Erro ao apagar histórico");
}

// ================= CHAT COM STREAMING =================

export interface ChatMeta {
  conversation_id: string;
  remaining_messages?: number;
  model?: string;
  plan?: string;
}

export interface ChatResponse {
  reply: string;
  thinking?: string;
  conversation_id: string;
  remaining_messages?: number;
  model?: string;
  plan?: string;
  ttft_ms?: number;
}

// ================= AGENT TOOL EVENTS =================

export interface AgentToolCallEvent {
  tool: string;
  args: Record<string, unknown>;
}

export interface AgentToolResultEvent {
  tool: string;
  summary: string;
}

export async function sendChatMessage(
  token: string,
  message: string,
  conversationId?: string | null,
  onDelta?: (delta: string) => void,
  onMeta?: (meta: ChatMeta) => void,
  fileBase64?: string,
  fileName?: string,
  fileMediaType?: string,
  selectedModel?: string,
  onAgentToolCall?: (evt: AgentToolCallEvent) => void,
  onAgentToolResult?: (evt: AgentToolResultEvent) => void,
  imageBase64?: string,
  imageMediaType?: string,
): Promise<ChatResponse> {
  const body: Record<string, string> = { message };
  if (conversationId) body.conversation_id = conversationId;
  if (fileBase64) body.file_base64 = fileBase64;
  if (fileName) body.file_name = fileName;
  if (fileMediaType) body.file_media_type = fileMediaType;
  if (selectedModel) body.model_slug = selectedModel;
  if (imageBase64) body.image_base64 = imageBase64;
  if (imageMediaType) body.image_media_type = imageMediaType;

  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Erro na resposta");
  if (!res.body) throw new Error("Stream não suportado");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: ChatResponse | null = null;
  let hasDelta = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const jsonStr = trimmed.slice(6).trim();
      if (!jsonStr) continue;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        continue;
      }

      if (parsed.error) {
        throw new Error(String(parsed.error));
      }

      if (parsed.conversation_id) {
        const meta: ChatMeta = {
          conversation_id: parsed.conversation_id as string,
          remaining_messages: parsed.remaining_messages as number | undefined,
          model: parsed.model as string | undefined,
          plan: parsed.plan as string | undefined,
        };
        onMeta?.(meta);
      }

      if (typeof parsed.delta === "string") {
        hasDelta = true;
        onDelta?.(parsed.delta);
      }

      if (parsed.agent_tool_call) {
        onAgentToolCall?.({
          tool: String(parsed.agent_tool_call),
          args: (parsed.args ?? {}) as Record<string, unknown>,
        });
      }

      if (parsed.agent_tool_result) {
        onAgentToolResult?.({
          tool: String(parsed.agent_tool_result),
          summary: String(parsed.summary ?? ""),
        });
      }

      if (parsed.done && typeof parsed.full_reply === "string") {
        // Se não vieram deltas (safeguard, leak filter, etc.), injeta o full_reply direto
        if (!hasDelta) {
          onDelta?.(parsed.full_reply);
        }

        result = {
          reply: parsed.full_reply,
          thinking: typeof parsed.thinking === "string" && parsed.thinking
            ? parsed.thinking
            : undefined,
          conversation_id: (parsed.conversation_id as string) ?? conversationId ?? "",
          remaining_messages: parsed.remaining_messages as number | undefined,
          model: parsed.model as string | undefined,
          plan: parsed.plan as string | undefined,
        };
      }
    }
  }

  if (!result) throw new Error("Stream encerrado sem resposta final");
  return result;
}



// ================= IMAGE GENERATION =================

export interface ImageGenResponse {
  prompt_refined: string;
  image_url: string;
  conversation_id?: string;
  remaining_messages?: number;
}

export async function generateImage(
  token: string,
  message: string,
  signal?: AbortSignal,
  conversationId?: string | null,
): Promise<ImageGenResponse> {
  const body: Record<string, string> = { message };
  if (conversationId) body.conversation_id = conversationId;

  const res = await fetch(`${API_URL}/generate-image`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let errMsg = `Erro ${res.status}`;
    try {
      const err = await res.json();
      errMsg = err.error ?? errMsg;
    } catch { /* ignora */ }
    throw new Error(errMsg);
  }

  if (!res.body) throw new Error("Stream não suportado");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const jsonStr = trimmed.slice(6).trim();
      if (!jsonStr) continue;

      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(jsonStr); } catch { continue; }

      if (parsed.error) throw new Error(String(parsed.error));

      if (parsed.done) {
        return {
          prompt_refined: parsed.prompt_refined as string,
          image_url: parsed.image_url as string,
          conversation_id: parsed.conversation_id as string | undefined,
          remaining_messages: parsed.remaining_messages as number | undefined,
        };
      }
    }
  }

  throw new Error("Stream encerrado sem resposta final");
}

export async function fetchTTS(token: string, text: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/tts`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Erro ao gerar áudio");
  return res.blob();
}

// ================= SANDBOX =================

export interface SandboxResponse {
  output_url: string;
  output_type: string;
  title: string;
  log_id: string;
  stdout?: string;
  conversation_id?: string;
  remaining_messages?: number;
  public_url?: string;
  file_content?: string;
  github_files?: Record<string, string>;
}

export type SandboxStatusCallback = (
  status: string,
  message?: string,
  detail?: { code?: string; error?: string; attempt?: number; retrying?: boolean }
) => void;

export async function sendSandboxMessage(
  token: string,
  command: string,
  fileBase64?: string,
  fileName?: string,
  fileMediaType?: string,
  onStatus?: SandboxStatusCallback,
  conversationId?: string | null,
): Promise<SandboxResponse> {
  const body: Record<string, string> = { command };
  if (fileBase64) body.file_base64 = fileBase64;
  if (fileName) body.file_name = fileName;
  if (fileMediaType) body.file_media_type = fileMediaType;
  if (conversationId) body.conversation_id = conversationId;

  const res = await fetch(`${API_URL}/sandbox`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errMsg = `Erro ${res.status}`;
    try { const err = await res.json(); errMsg = err.error ?? errMsg; } catch { /* ignora */ }
    throw new Error(errMsg);
  }

  if (!res.body) throw new Error("Stream não suportado");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const jsonStr = trimmed.slice(6).trim();
      if (!jsonStr) continue;

      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(jsonStr); } catch { continue; }

      if (parsed.status) {
        onStatus?.(String(parsed.status), parsed.message ? String(parsed.message) : undefined, {
          code: parsed.code as string | undefined,
          error: parsed.error as string | undefined,
          attempt: parsed.attempt as number | undefined,
          retrying: parsed.retrying as boolean | undefined,
        });
      }

      if (parsed.error && !parsed.status) throw new Error(String(parsed.error));

      if (parsed.done) {
        return {
          output_url: parsed.output_url as string,
          output_type: parsed.output_type as string,
          title: parsed.title as string,
          log_id: parsed.log_id as string,
          stdout: parsed.stdout as string | undefined,
          remaining_messages: parsed.remaining_messages as number | undefined,
          public_url: parsed.public_url as string | undefined,
          file_content: parsed.file_content as string | undefined,
          github_files: parsed.github_files as Record<string, string> | undefined,
        };
      }
    }
  }

  throw new Error("Stream encerrado sem resposta final");
}
