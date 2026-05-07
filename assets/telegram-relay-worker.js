/**
 * Cloudflare Worker relay for Telegram Bot API.
 *
 * Deploy (free):
 * 1) npm i -g wrangler
 * 2) wrangler login
 * 3) wrangler init tg-relay
 * 4) Put this file into src/index.js (or adapt export).
 * 5) wrangler secret put TELEGRAM_BOT_TOKEN
 * 6) wrangler deploy
 *
 * Then set TELEGRAM_PROXY_URL in assets/script.js:
 *   https://<your-worker>.workers.dev/sendMessage
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405, corsHeaders);
    }

    try {
      const body = await request.json();
      const chat_id = String(body.chat_id || "").trim();
      const text = String(body.text || "");
      const parse_mode = body.parse_mode || "HTML";
      const disable_web_page_preview =
        body.disable_web_page_preview === undefined
          ? true
          : !!body.disable_web_page_preview;

      if (!env.TELEGRAM_BOT_TOKEN) {
        return json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN secret" }, 500, corsHeaders);
      }
      if (!chat_id || !text) {
        return json({ ok: false, error: "chat_id and text are required" }, 400, corsHeaders);
      }

      const telegramRes = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id,
            text,
            parse_mode,
            disable_web_page_preview,
          }),
        },
      );

      const telegramJson = await telegramRes.json().catch(() => ({}));
      return json(telegramJson, telegramRes.status, corsHeaders);
    } catch (err) {
      return json(
        { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
        500,
        corsHeaders,
      );
    }
  },
};

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}
