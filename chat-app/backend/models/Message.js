const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    user: String,
    text: String , 
    to: String, //optional receiver username for private
    timestamp: { type: Date , default: Date.now },
});

module.exports = mongoose.model("Message" ,  MessageSchema);