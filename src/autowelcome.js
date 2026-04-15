const TARGET_BOT_USERNAME = "fistingguidebot";

export async function tryAutoWelcome(message, env, callTelegram) {
  if (!shouldWelcome(message)) return false;

  const chatId = message.chat.id;
  const chatName = message.chat.title || "this group";
  const text = `welcom to ${chatName}`;

  await callTelegram(
    "sendMessage",
    {
      chat_id: chatId,
      text,
    },
    env
  );

  return true;
}

function shouldWelcome(message) {
  const chatType = message?.chat?.type;
  if (chatType !== "group" && chatType !== "supergroup") return false;

  const newMembers = message?.new_chat_members;
  if (!Array.isArray(newMembers) || newMembers.length === 0) return false;

  // Do not welcome when only the bot itself joins.
  return newMembers.some((member) => {
    const username = (member?.username || "").toLowerCase();
    return username !== TARGET_BOT_USERNAME;
  });
}
