const TARGET_BOT_USERNAME = "fistingguidebot";

export async function tryAutoWelcome(update, env, callTelegram) {
  const welcomeContext = getWelcomeContext(update);
  if (!welcomeContext) return false;

  const chatId = welcomeContext.chatId;
  const chatName = welcomeContext.chatName || "this group";
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

function getWelcomeContext(update) {
  const message = update?.message;
  if (shouldWelcomeFromMessage(message)) {
    return {
      chatId: message.chat.id,
      chatName: message.chat.title,
    };
  }

  const chatMember = update?.chat_member;
  if (shouldWelcomeFromChatMember(chatMember)) {
    return {
      chatId: chatMember.chat.id,
      chatName: chatMember.chat.title,
    };
  }

  return null;
}

function shouldWelcomeFromMessage(message) {
  const chatType = message?.chat?.type;
  if (!isGroupType(chatType)) return false;

  const newMembers = message?.new_chat_members;
  if (!Array.isArray(newMembers) || newMembers.length === 0) return false;

  // Do not welcome when only the bot itself joins.
  return newMembers.some((member) => {
    const username = (member?.username || "").toLowerCase();
    return username !== TARGET_BOT_USERNAME;
  });
}

function shouldWelcomeFromChatMember(chatMemberUpdate) {
  const chatType = chatMemberUpdate?.chat?.type;
  if (!isGroupType(chatType)) return false;

  const newMember = chatMemberUpdate?.new_chat_member?.user;
  if (!newMember) return false;

  const username = (newMember.username || "").toLowerCase();
  if (username === TARGET_BOT_USERNAME) return false;

  const oldStatus = chatMemberUpdate?.old_chat_member?.status;
  const newStatus = chatMemberUpdate?.new_chat_member?.status;

  if (!oldStatus || !newStatus) return false;
  if (!isActiveMemberStatus(newStatus)) return false;

  // Welcome when user transitions from non-member states to active states.
  const wasNotInChat =
    oldStatus === "left" || oldStatus === "kicked" || oldStatus === "restricted";

  return wasNotInChat;
}

function isGroupType(chatType) {
  return chatType === "group" || chatType === "supergroup";
}

function isActiveMemberStatus(status) {
  return status === "member" || status === "administrator" || status === "creator";
}
