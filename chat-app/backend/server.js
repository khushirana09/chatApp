require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const userRoutes = require("./routes/auth");

const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://chat-app-sigma-lemon.vercel.app", // your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", userRoutes);

// JWT Auth Middleware for Socket.IO
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded;
    next();
  });
};

io.use(authenticateSocket);

// Database connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

  
// Socket.IO connection
io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  // Set username on connect
  socket.on("setUsername", async (username) => {
    socket.username = username;
    socket.broadcast.emit("userConnected", username);
  });

  // Typing indicator
  socket.on("typing", () => {
    socket.broadcast.emit("typing", socket.username);
  });

  // Stop typing
  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping", socket.username);
  });

  // Receive and broadcast message
  socket.on("chatMessage", async ({ text, to }) => {
    const message = new Message({
      text,
      sender: socket.username,
      receiver: to,
    });
    await message.save();
    io.emit("chatMessage", {
      text,
      sender: socket.username,
      receiver: to,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("🚪 Client disconnected:", socket.id);
    socket.broadcast.emit("userDisconnected", socket.username);
  });
});

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
