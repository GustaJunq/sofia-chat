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

/**
 * Envia uma mensagem ao backend com suporte a streaming SSE.
 *
 * @param token           JWT do usuário
 * @param message         Texto enviado pelo usuário
 * @param conversationId  ID da conversa (null = nova conversa)
 * @param onDelta         Callback chamado a cada chunk de texto recebido
 * @param onMeta          Callback chamado com os metadados iniciais (conversation_id, etc.)
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
): Promise<ChatResponse> {
  const body: Record<string, string> = { message };
  if (conversationId) body.conversation_id = conversationId;
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

export async function fetchTTS(token: string, text: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/tts`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Erro ao gerar áudio");
  return res.blob();
}
