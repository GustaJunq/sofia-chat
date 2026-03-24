export const API_URL = "https://sofia-api-z8nr.onrender.com";

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

/**
 * Envia uma mensagem ao backend com suporte a streaming SSE.
 *
 * @param token           JWT do usuário
 * @param message         Texto enviado pelo usuário
 * @param conversationId  ID da conversa (null = nova conversa)
 * @param onDelta         Callback chamado a cada chunk de texto recebido
 * @param onMeta          Callback chamado com os metadados iniciais (conversation_id, etc.)
 * @param onAgentToolCall Callback quando o agente inicia uma ferramenta
 * @param onAgentToolResult Callback quando o resultado de uma ferramenta chega
 * @returns               ChatResponse com o reply completo ao final
 */
export async function sendChatMessage(
  token: string,
  message: string,
  conversationId?: string | null,
  onDelta?: (delta: string) => void,
  onMeta?: (meta: ChatMeta) => void,
  imageBase64?: string,
  imageMediaType?: string,
  fileBase64?: string,
  fileName?: string,
  fileMediaType?: string,
  selectedModel?: string,
  onAgentToolCall?: (evt: AgentToolCallEvent) => void,
  onAgentToolResult?: (evt: AgentToolResultEvent) => void,
): Promise<ChatResponse> {
  const body: Record<string, string> = { message };
  if (conversationId) body.conversation_id = conversationId;
  if (imageBase64) body.image_base64 = imageBase64;
  if (imageMediaType) body.image_media_type = imageMediaType;
  if (fileBase64) body.file_base64 = fileBase64;
  if (fileName) body.file_name = fileName;
  if (fileMediaType) body.file_media_type = fileMediaType;
  if (selectedModel) body.model_slug = selectedModel;

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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Processa todas as linhas completas acumuladas no buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // última linha pode estar incompleta

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

      // Erro vindo do backend
      if (parsed.error) {
        throw new Error(String(parsed.error));
      }

      // Metadados iniciais (primeiro evento)
      if (parsed.conversation_id) {
        const meta: ChatMeta = {
          conversation_id: parsed.conversation_id as string,
          remaining_messages: parsed.remaining_messages as number | undefined,
          model: parsed.model as string | undefined,
          plan: parsed.plan as string | undefined,
        };
        onMeta?.(meta);
      }

      // Chunk de texto parcial
      if (typeof parsed.delta === "string") {
        onDelta?.(parsed.delta);
      }

      // Agente iniciou uma ferramenta
      if (parsed.agent_tool_call) {
        onAgentToolCall?.({
          tool: String(parsed.agent_tool_call),
          args: (parsed.args ?? {}) as Record<string, unknown>,
        });
      }

      // Resultado de ferramenta chegou
      if (parsed.agent_tool_result) {
        onAgentToolResult?.({
          tool: String(parsed.agent_tool_result),
          summary: String(parsed.summary ?? ""),
        });
      }

      // Evento final com reply completo
      if (parsed.done && typeof parsed.full_reply === "string") {
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

// ================= OPENROUTER KEY =================

export function getOpenRouterKey(): string | null {
  return localStorage.getItem("sof_openrouter_key");
}

export function saveOpenRouterKey(key: string): void {
  localStorage.setItem("sof_openrouter_key", key.trim());
}

export function clearOpenRouterKey(): void {
  localStorage.removeItem("sof_openrouter_key");
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
  openRouterKey: string,
  signal?: AbortSignal,
  conversationId?: string | null,
  referenceImage?: string,
): Promise<ImageGenResponse> {
  const body: Record<string, string> = { message, openrouter_key: openRouterKey };
  if (conversationId) body.conversation_id = conversationId;
  if (referenceImage) body.reference_image = referenceImage;

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

  // O endpoint retorna SSE para evitar timeout do Render durante a geração
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
      // parsed.status === "generating" → heartbeat, continua aguardando
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

      // Eventos com status (exec_error, etc.) devem atualizar o callback ANTES de lançar erro
      if (parsed.status) {
        onStatus?.(String(parsed.status), parsed.message ? String(parsed.message) : undefined, {
          code: parsed.code as string | undefined,
          error: parsed.error as string | undefined,
          attempt: parsed.attempt as number | undefined,
          retrying: parsed.retrying as boolean | undefined,
        });
      }

      // Evento de erro final (sem status) — lança exceção
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
