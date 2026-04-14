const REGION_KEYS = [1, 2, 3, 4, 5, 6, 7, 8];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({ ok: true, message: "tg bot worker is running" });
    }

    if (request.method === "POST" && url.pathname === "/telegram") {
      try {
        const update = await request.json();
        await handleTelegramUpdate(update, env);
        return json({ ok: true });
      } catch (error) {
        return json({ ok: false, error: String(error) }, 500);
      }
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleTelegramUpdate(update, env) {
  const message = update?.message;
  if (!message) return;

  const text = (message.text || "").trim();
  if (!text) return;

  const command = normalizeCommand(text);
  const shouldReply = command === "/addgroup";

  console.log(
    JSON.stringify({
      type: "incoming_message",
      from_id: message?.from?.id ?? null,
      username: message?.from?.username ?? null,
      chat_id: message?.chat?.id ?? null,
      chat_type: message?.chat?.type ?? null,
      text,
      command,
      should_reply: shouldReply,
      update_id: update?.update_id ?? null,
    })
  );

  if (!shouldReply) return;

  const inlineKeyboard = buildRegionKeyboard(env);
  await callTelegram(
    "sendMessage",
    {
      chat_id: message.chat.id,
      text: "\u8bf7\u9009\u62e9\u533a\u57df\u8fdb\u5165\u5bf9\u5e94\u7fa4\uff1a",
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    },
    env
  );
}

function normalizeCommand(text) {
  if (!text.startsWith("/")) return "";
  const firstToken = text.split(/\s+/, 1)[0];
  const atIndex = firstToken.indexOf("@");
  return atIndex === -1 ? firstToken : firstToken.slice(0, atIndex);
}

function buildRegionKeyboard(env) {
  const buttons = REGION_KEYS.map((idx) => {
    const name = env[`REGION_${idx}_NAME`] || `Region ${idx}`;
    const url = env[`REGION_${idx}_URL`] || "https://t.me";
    return { text: name, url };
  });

  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  return rows;
}

async function callTelegram(method, payload, env) {
  const token = env.TG_BOT_TOKEN;
  if (!token) {
    throw new Error("Missing TG_BOT_TOKEN in Worker env");
  }

  const endpoint = `https://api.telegram.org/bot${token}/${method}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      `Telegram API ${method} failed: ${response.status} ${bodyText}`
    );
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
