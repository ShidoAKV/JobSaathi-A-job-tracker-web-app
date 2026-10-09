const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const MAX_TEXT = 2000;

const isParticipant = (conversation, userId) =>
  conversation.participants.some((p) => (p._id || p).toString() === userId.toString());

class MessageError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Shared by the REST controller and the Socket.IO handler.
 * Validates, stores, bumps the conversation and returns a populated message.
 */
const createMessage = async ({ conversationId, senderId, senderName, text }) => {
  const clean = (text || "").trim();
  if (!clean) throw new MessageError("Message text is required", 400);
  if (clean.length > MAX_TEXT) throw new MessageError(`Message is too long (max ${MAX_TEXT} characters)`, 400);

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new MessageError("Conversation not found", 404);
  if (!isParticipant(conversation, senderId)) {
    throw new MessageError("Not a participant of this conversation", 403);
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    text: clean,
    readBy: [senderId],
  });

  conversation.lastMessage = clean.length > 120 ? `${clean.slice(0, 117)}...` : clean;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  return {
    message: {
      _id: message._id,
      conversation: conversation._id,
      sender: { _id: senderId, name: senderName },
      text: message.text,
      createdAt: message.createdAt,
    },
    conversation,
  };
};

/** Mark every message in the conversation not sent by userId as read by userId. */
const markConversationRead = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new MessageError("Conversation not found", 404);
  if (!isParticipant(conversation, userId)) {
    throw new MessageError("Not a participant of this conversation", 403);
  }
  const result = await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: userId }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );
  return { conversation, modified: result.modifiedCount || 0 };
};

module.exports = { createMessage, markConversationRead, isParticipant, MessageError };
