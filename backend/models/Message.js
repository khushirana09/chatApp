const mongoose = require("mongoose");

// Create a message schema
const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // Username or ID of sender
  receiver: { type: String, required: true }, // Username or ID of receiver
  message: { type: String, required: true }, // The message text
  timestamp: { type: Date, default: Date.now }, // When it was sent (default = now)
  media: { type: String, default: null }, // for media
  createdAt: { type: Date, default: Date.now },
});

// Create a message model
const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
