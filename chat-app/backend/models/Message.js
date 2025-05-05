const mongoose = require('mongoose');

// Create a message schema
const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Create a message model
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
