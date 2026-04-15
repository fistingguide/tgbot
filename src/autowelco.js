const TARGET_BOT_USERNAME = "fistingguidebot";

export async function tryAutoWelcome(update, env, callTelegram) {
  const welcomeContext = getWelcomeContext(update);
  if (!welcomeContext) return false;

  const chatId = welcomeContext.chatId;
  const chatName = welcomeContext.chatName || "this group";
  const memberName = welcomeContext.memberName || "new member";
  const text = `welcome ${memberName} to ${chatName},our site is https://www.fisting.guide/`;

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
  const messageContext = getWelcomeContextFromMessage(message);
  if (messageContext) return messageContext;

  const chatMember = update?.chat_member;
  const chatMemberContext = getWelcomeContextFromChatMember(chatMember);
  if (chatMemberContext) return chatMemberContext;

  return null;
}

function getWelcomeContextFromMessage(message) {
  const chatType = message?.chat?.type;
  if (!isGroupType(chatType)) return null;

  const newMembers = message?.new_chat_members;
  if (!Array.isArray(newMembers) || newMembers.length === 0) return null;

  // Do not welcome when only the bot itself joins.
  const joinedMember = newMembers.find((member) => {
    const username = (member?.username || "").toLowerCase();
    return username !== TARGET_BOT_USERNAME;
  });
  if (!joinedMember) return null;

  return {
    chatId: message.chat.id,
    chatName: message.chat.title,
    memberName: getDisplayName(joinedMember),
  };
}

function getWelcomeContextFromChatMember(chatMemberUpdate) {
  const chatType = chatMemberUpdate?.chat?.type;
  if (!isGroupType(chatType)) return null;

  const newMember = chatMemberUpdate?.new_chat_member?.user;
  if (!newMember) return null;

  const username = (newMember.username || "").toLowerCase();
  if (username === TARGET_BOT_USERNAME) return null;

  const oldStatus = chatMemberUpdate?.old_chat_member?.status;
  const newStatus = chatMemberUpdate?.new_chat_member?.status;

  if (!oldStatus || !newStatus) return null;
  if (!isActiveMemberStatus(newStatus)) return null;

  // Welcome when user transitions from non-member states to active states.
  const wasNotInChat =
    oldStatus === "left" || oldStatus === "kicked" || oldStatus === "restricted";
  if (!wasNotInChat) return null;

  return {
    chatId: chatMemberUpdate.chat.id,
    chatName: chatMemberUpdate.chat.title,
    memberName: getDisplayName(newMember),
  };
}

function isGroupType(chatType) {
  return chatType === "group" || chatType === "supergroup";
}

function isActiveMemberStatus(status) {
  return status === "member" || status === "administrator" || status === "creator";
}

function getDisplayName(user) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (user?.username) return `@${user.username}`;
  return "new member";
}
