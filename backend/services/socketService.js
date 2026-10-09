const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const { env, isAllowedOrigin } = require("../config/env");
const { createMessage, markConversationRead, isParticipant } = require("./messageService");
const { createSocketBucket } = require("../middleware/rateLimiter");

let io = null;

const userRoom = (userId) => `user:${userId}`;
const conversationRoom = (conversationId) => `conversation:${conversationId}`;

const getIO = () => io;

const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(userRoom(userId.toString())).emit(event, payload);
};

const emitToConversation = (conversationId, event, payload) => {
  if (!io || !conversationId) return;
  io.to(conversationRoom(conversationId.toString())).emit(event, payload);
};

/** Broadcast a freshly created message to the room and bump both participants' lists. */
const broadcastMessage = ({ message, conversation, senderId }) => {
  emitToConversation(conversation._id, "message:new", message);
  conversation.participants.forEach((pid) => {
    emitToUser(pid, "conversation:updated", {
      conversationId: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      senderId,
    });
  });
};

const extractToken = (socket) => {
  const fromAuth = socket.handshake.auth && socket.handshake.auth.token;
  if (fromAuth) return fromAuth;
  const header = socket.handshake.headers && socket.handshake.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7);
  return null;
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) =>
        isAllowedOrigin(origin) ? callback(null, true) : callback(new Error("CORS: origin not allowed")),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("Unauthorized"));
      socket.user = user;
      return next();
    } catch (_) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const me = socket.user;
    socket.join(userRoom(me._id.toString()));

    // Per-socket rate limits: 20 messages / 10s, 10 typing pings / 5s.
    const allowMessage = createSocketBucket(20, 10_000);
    const allowTyping = createSocketBucket(10, 5_000);

    socket.on("conversation:join", async (conversationId, ack = () => {}) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !isParticipant(conversation, me._id)) {
          return ack({ error: "Not a participant of this conversation" });
        }
        socket.join(conversationRoom(conversation._id.toString()));
        return ack({ ok: true });
      } catch (err) {
        return ack({ error: err.message });
      }
    });

    socket.on("conversation:leave", (conversationId) => {
      if (conversationId) socket.leave(conversationRoom(conversationId.toString()));
    });

    socket.on("message:send", async (payload = {}, ack = () => {}) => {
      if (!allowMessage()) return ack({ error: "You are sending messages too quickly. Please slow down." });
      try {
        const { conversationId, text } = payload;
        const { message, conversation } = await createMessage({
          conversationId,
          senderId: me._id,
          senderName: me.name,
          text,
        });
        broadcastMessage({ message, conversation, senderId: me._id });
        return ack({ ok: true, message });
      } catch (err) {
        return ack({ error: err.message });
      }
    });

    socket.on("messages:read", async (payload = {}, ack = () => {}) => {
      try {
        const { conversation } = await markConversationRead({
          conversationId: payload.conversationId,
          userId: me._id,
        });
        emitToConversation(conversation._id, "messages:read", {
          conversationId: conversation._id,
          userId: me._id,
        });
        return ack({ ok: true });
      } catch (err) {
        return ack({ error: err.message });
      }
    });

    socket.on("typing", (payload = {}) => {
      const { conversationId, isTyping } = payload;
      if (!conversationId || !allowTyping()) return;
      socket.to(conversationRoom(conversationId.toString())).emit("typing", {
        conversationId,
        userId: me._id,
        name: me.name,
        isTyping: Boolean(isTyping),
      });
    });
  });

  return io;
};

module.exports = { initSocket, getIO, emitToUser, emitToConversation, broadcastMessage };
