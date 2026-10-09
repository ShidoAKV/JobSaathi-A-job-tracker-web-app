const asyncHandler = require("../utils/asyncHandler");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const JobListing = require("../models/JobListing");
const { createMessage, isParticipant, MessageError } = require("../services/messageService");
const { broadcastMessage } = require("../services/socketService");

const USER_FIELDS = "_id name email";
const LISTING_FIELDS = "_id company role";

const populateConversation = (query) =>
  query.populate("listing", LISTING_FIELDS).populate("participants", USER_FIELDS);

// POST /api/conversations  { listingId }
const startConversation = asyncHandler(async (req, res) => {
  const { listingId } = req.body;
  if (!listingId) return res.status(400).json({ message: "listingId is required" });

  const listing = await JobListing.findById(listingId);
  if (!listing) return res.status(404).json({ message: "Listing not found" });

  const me = req.user._id;
  const poster = listing.postedBy;

  if (poster.toString() === me.toString()) {
    return res.status(400).json({ message: "You posted this listing" });
  }

  let conversation = await populateConversation(
    Conversation.findOne({
      listing: listing._id,
      participants: { $all: [me, poster], $size: 2 },
    })
  );

  if (conversation) return res.status(200).json(conversation);

  conversation = await Conversation.create({
    listing: listing._id,
    participants: [me, poster],
    lastMessage: "",
    lastMessageAt: new Date(),
  });

  conversation = await populateConversation(Conversation.findById(conversation._id));
  res.status(201).json(conversation);
});

// GET /api/conversations
const getConversations = asyncHandler(async (req, res) => {
  const me = req.user._id;

  const conversations = await populateConversation(
    Conversation.find({ participants: me }).sort({ lastMessageAt: -1 })
  ).lean();

  const unreadCounts = await Promise.all(
    conversations.map((c) =>
      Message.countDocuments({ conversation: c._id, sender: { $ne: me }, readBy: { $ne: me } })
    )
  );

  const result = conversations.map((c, i) => ({
    _id: c._id,
    listing: c.listing,
    participants: c.participants,
    otherUser: c.participants.find((p) => p._id.toString() !== me.toString()) || null,
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt,
    unreadCount: unreadCounts[i],
  }));

  res.json(result);
});

// GET /api/conversations/:id/messages?after=ISO
const getMessages = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });
  if (!isParticipant(conversation, me)) {
    return res.status(403).json({ message: "Not a participant of this conversation" });
  }

  const filter = { conversation: conversation._id };
  if (req.query.after) {
    const after = new Date(req.query.after);
    if (!Number.isNaN(after.getTime())) filter.createdAt = { $gt: after };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: 1 })
    .populate("sender", "_id name")
    .lean();

  const unreadIds = messages
    .filter(
      (m) =>
        m.sender._id.toString() !== me.toString() &&
        !m.readBy.some((r) => r.toString() === me.toString())
    )
    .map((m) => m._id);

  if (unreadIds.length) {
    await Message.updateMany({ _id: { $in: unreadIds } }, { $addToSet: { readBy: me } });
  }

  res.json(
    messages.map((m) => ({ _id: m._id, sender: m.sender, text: m.text, createdAt: m.createdAt }))
  );
});

// POST /api/conversations/:id/messages  { text }
const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { message, conversation } = await createMessage({
      conversationId: req.params.id,
      senderId: req.user._id,
      senderName: req.user.name,
      text: req.body.text,
    });
    broadcastMessage({ message, conversation, senderId: req.user._id });
    res.status(201).json(message);
  } catch (err) {
    if (err instanceof MessageError) return res.status(err.statusCode).json({ message: err.message });
    throw err;
  }
});

module.exports = { startConversation, getConversations, getMessages, sendMessage };
