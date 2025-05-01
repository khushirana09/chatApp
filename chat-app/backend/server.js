require("dotenv").config();
// Import required modules
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth"); // Authentication routes

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Create HTTP server from Express app
const server = http.createServer(app);

//here jwt token
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.query.token; //socket sends token as query
  if (!token) return next(new Error("Authentication error"));
  jwt.verify(token, process.env.JWT_SECRET, (err, deocded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded; //attact user info to socket
    next();
  });
};

//use this middleware when initializing socket.io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // frontend origin
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware: Enable CORS and parse JSON request bodies
app.use(
  cors({
    origin: "http://localhost:3000", // or whatever your frontend runs on
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB using Mongoose
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Route middleware for authentication endpoints
app.use("/api", authRoutes); // Register + Login endpoints will use /api prefix

// Store connected users
let onlineUsers = {}; // Example: { socketId1: 'John', socketId2: 'Alice' }

// Handle Socket.io events
io.on("connection", async (socket) => {
  const messages = await Message.find().limit(100); /// get the last 100 messages
  socket.emit("chatHistory", messages);

  socket.on("chatMessage", async (message) => {
    //handle new message on above
  });

  // When a user joins with their username
  socket.on("setUsername", (username) => {
    onlineUsers[socket.id] = username; // Save username with socket id
    console.log(`👤 ${username} connected`);

    // Send updated user list to all clients
    io.emit("updateUserList", Object.values(onlineUsers));
  });

  // listen for typing events
  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username); // notify others
  });

  // When a user sends a message
  socket.on("chatMessage", async (message) => {
    const username = onlineUsers[socket.id];
    if (username) {
      const msg = { user: username, text: message };

      //save message to db
      const newMessage = new Message(msg);
      await newMessage.save();

      //send to specific User
      const targetSocketId = Object.keys(onlineUsers).find(
        (key) => onlineUsers[key] === targetUser
      );

      if (targetSocketId) {
        io.to(targetSocketId).emit("chatMessage", msg); // send private message
      } else {
        // Broadcast message to all clients
        io.emit("chatMessage", msg);
      }
    }
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    const disconnectedUser = onlineUsers[socket.id];
    delete onlineUsers[socket.id];
    console.log(`❌ ${disconnectedUser} disconnected`);

    // Update user list for all clients
    io.emit("updateUserList", Object.values(onlineUsers));
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
