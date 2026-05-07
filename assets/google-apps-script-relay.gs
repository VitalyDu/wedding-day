/**
 * Google Apps Script relay for Telegram Bot API (free).
 *
 * Setup:
 * 1) Create new Apps Script project: https://script.google.com/
 * 2) Paste this file as Code.gs
 * 3) In Project Settings -> Script properties add:
 *      TELEGRAM_BOT_TOKEN = <your_bot_token>
 * 4) Deploy -> New deployment -> Web app:
 *      Execute as: Me
 *      Who has access: Anyone
 * 5) Copy Web app URL and put it into:
 *      TELEGRAM_PROXY_URL in assets/script.js
 */

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var body = JSON.parse(raw);

    var chatId = String(body.chat_id || "").trim();
    var text = String(body.text || "");
    var parseMode = body.parse_mode || "HTML";
    var disablePreview =
      body.disable_web_page_preview === undefined
        ? true
        : !!body.disable_web_page_preview;

    var token = PropertiesService.getScriptProperties().getProperty(
      "TELEGRAM_BOT_TOKEN",
    );

    if (!token) {
      return jsonResponse({
        ok: false,
        error: "Missing TELEGRAM_BOT_TOKEN in Script Properties",
      });
    }
    if (!chatId || !text) {
      return jsonResponse({ ok: false, error: "chat_id and text are required" });
    }

    var telegramRes = UrlFetchApp.fetch(
      "https://api.telegram.org/bot" + token + "/sendMessage",
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: parseMode,
          disable_web_page_preview: disablePreview,
        }),
        muteHttpExceptions: true,
      },
    );

    var code = telegramRes.getResponseCode();
    var textRes = telegramRes.getContentText();
    var parsed;
    try {
      parsed = JSON.parse(textRes);
    } catch (parseErr) {
      parsed = { ok: false, error: "Invalid Telegram response", raw: textRes };
    }

    parsed.http_status = code;
    return jsonResponse(parsed);
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : "Unknown error",
    });
  }
}

function doGet() {
  return jsonResponse({
    ok: true,
    message: "Telegram relay is alive. Use POST requests.",
  });
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
