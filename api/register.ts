import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_URL = process.env.VITE_API_URL || "https://api.synastria.dev";
const REGISTRATION_KEY = process.env.REGISTRATION_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Injeta a chave secreta que está segura no ambiente do Vercel (Server-side)
    if (REGISTRATION_KEY) {
      headers["X-User-Key"] = REGISTRATION_KEY;
    }

    const apiRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();

    return res.status(apiRes.status).json(data);
  } catch (error) {
    console.error("[PROXY ERROR]", error);
    return res.status(500).json({ error: "Internal Server Error in Proxy" });
  }
}
