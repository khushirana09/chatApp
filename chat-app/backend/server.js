const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const userRoutes = require("./routes/auth");
const userRoute = require("./routes/userRoutes");
const User = require("./models/User");
const Message = require("./models/Message");

const usersOnline = {}; // Track online users

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Allowed frontend origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://chat-app-indol-ten.vercel.app",
];

// ✅ Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// ✅ Express CORS middleware
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// ✅ API routes
app.use("/api/auth", userRoutes);
app.use("/api/users", userRoute);

// ✅ User and socket mapping
const users = {}; // username -> socketId
const userSocketMap = {}; // username -> socketId

// ✅ Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded; // Attach user info
    next();
  });
});

// ✅ Handle Socket.IO connection
io.on("connection", (socket) => {
  const username = socket.user.username;
  console.log(`✅ ${username} connected (socket ID: ${socket.id})`);

  // 🔵 Mark user online
  usersOnline[username] = true;
  users[username] = socket.id;
  userSocketMap[username] = socket.id;

  // Notify all clients of this user's status
  io.emit("user-status", { userId: username, status: "online" });

  // Send full list of statuses on connect
  io.emit("initial-user-status", usersOnline);

  // ✅ On login, log and broadcast
  socket.on("user-login", (userId) => {
    usersOnline[userId] = true;
    io.emit("user-status", { userId, status: "online" });
    console.log(`🔓 ${userId} logged in and marked online`);
  });

  // ✅ Receive chat message (global or private)
  socket.on("chatMessage", async ({ text, to }) => {
    const sender = username;
    const receiver = to;

    const newMessage = new Message({
      sender,
      receiver,
      message: text,
      timestamp: new Date(),
    });

    await newMessage.save();

    const messageData = {
      sender,
      receiver,
      message: text,
      timestamp: newMessage.timestamp,
    };

    // If private message
    if (receiver !== "all" && users[receiver]) {
      const targetSocketId = users[receiver];
      socket.to(targetSocketId).emit("chatMessage", messageData);
      socket.emit("chatMessage", messageData); // echo back to sender
    } else {
      // Global message
      io.emit("chatMessage", messageData);
    }
  });

  // ✅ Typing indicators
  socket.on("typing", () => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

  // ✅ Fetch previous messages from DB
  socket.on("getMessages", async () => {
    try {
      const messages = await Message.find().sort({ timestamp: 1 }).lean();
      socket.emit("previousMessages", messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  });

  // ✅ Handle disconnection
  socket.on("disconnect", () => {
    console.log(`❌ ${username} disconnected`);
    delete usersOnline[username];
    delete users[username];
    delete userSocketMap[username];
    io.emit("user-status", { userId: username, status: "offline" });
  });
});

// ✅ Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
