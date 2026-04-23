import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_URL = process.env.VITE_API_URL || "https://sofia-api-p9na.onrender.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(400).send("Slug inválido");
  }

  try {
    // Busca a blob_url no backend
    const apiRes = await fetch(`${API_URL}/site/${slug}`);

    if (!apiRes.ok) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><title>Site não encontrado — SynastrIA</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff;
                 display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .box { text-align: center; }
          h1 { font-size: 2rem; margin-bottom: 8px; }
          p { color: #888; }
          a { color: #7C3AED; text-decoration: none; }
        </style>
        </head>
        <body>
          <div class="box">
            <h1>404</h1>
            <p>Site não encontrado.</p>
            <a href="https://synastria.dev">← Voltar pra SynastrIA</a>
          </div>
        </body>
        </html>
      `);
    }

    const { blob_url, title } = await apiRes.json();

    // Busca o HTML do Vercel Blob
    const htmlRes = await fetch(blob_url);
    if (!htmlRes.ok) {
      return res.status(502).send("Erro ao carregar o site.");
    }

    let html = await htmlRes.text();

    // Injeta badge "Feito com SynastrIA" no final do body
    const badge = `
<style>
  #syn-badge {
    position: fixed; bottom: 12px; right: 12px; z-index: 9999;
    background: rgba(0,0,0,0.75); color: #fff; font-size: 11px;
    padding: 5px 10px; border-radius: 20px; text-decoration: none;
    font-family: system-ui, sans-serif; backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.1);
  }
  #syn-badge:hover { background: rgba(124,58,237,0.8); }
</style>
<a id="syn-badge" href="https://synastria.dev" target="_blank">⚡ Feito com SynastrIA</a>`;

    html = html.replace(/<\/body>/i, `${badge}\n</body>`);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).send(html);

  } catch (e) {
    console.error(e);
    return res.status(500).send("Erro interno.");
  }
}
