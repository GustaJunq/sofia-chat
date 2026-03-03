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

export interface ChatResponse {
  reply: string;
  conversation_id: string;
  remaining_messages?: number;
}

export async function sendChatMessage(
  token: string,
  message: string,
  conversationId?: string | null
): Promise<ChatResponse> {
  const body: Record<string, string> = { message };
  if (conversationId) body.conversation_id = conversationId;

  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erro na resposta");
  return res.json();
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
