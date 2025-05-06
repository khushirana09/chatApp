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
const usersOnline = {}; //to store users online status

dotenv.config();

const app = express();
const server = http.createServer(app);

// 🌐 Setup allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://chat-app-indol-ten.vercel.app",
];

// 🌐 Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// 🌐 Setup Express CORS middleware
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
app.use(express.json()); // Parse incoming JSON

// 🚏 API Routes
app.use("/api/auth", userRoutes);
app.use("/api/users", userRoute);
// app.use("/api/messages", messageRoute); // Uncomment if used

// 🗺️ Track connected users and their socket IDs
const users = {};
const userSocketMap = {};

// 🔐 Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded; // Attach decoded user info
    next();
  });
});

// 💬 Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  const username = socket.user.username;

  // Handle user login
  socket.on("user-login", (userId) => {
    usersOnline[username] = true;
    io.emit("user-status", { userId: username, status: "online" });
    console.log(`User ${userId} is now online`);
  });

  // 🟢 Store user and socket ID
  users[username] = socket.id;
  userSocketMap[username] = socket.id;
  console.log(`${username} connected with socket ID ${socket.id}`);

  // 📥 Listen for private messages
  socket.on("private-message", ({ to, from, message }) => {
    console.log("Private message from", from, "to", to, ":", message);

    const targetSocketId = users[to];
    if (targetSocketId) {
      // 👇 Send only to that user
      socket.to(targetSocketId).emit("private-message", { from, message });
    }
  });

  // 📥 Load previous chat messages from DB
  socket.on("getMessages", async () => {
    try {
      const messages = await Message.find({}); // oldest to newest
      socket.emit("previousMessages", messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  });

  // 📥 Public or Private Chat Message Logic
  socket.on("chatMessage", async ({ text, to }) => {
    const message = new Message({
      sender: username,
      receiver: to,
      message: text,
    });

    await message.save();

    const payload = {
      sender: username,
      receiver: to,
      message: text,
    };

    if (to === "all") {
      // 🌍 Broadcast to everyone
      io.emit("chatMessage", payload);
    } else {
      // 📤 Send to receiver
      if (userSocketMap[to]) {
        io.to(userSocketMap[to]).emit("chatMessage", payload);
      }

      // 📤 Also send to sender (for self-view)
      socket.emit("chatMessage", payload);
    }
  });

  socket.emit("initial-user-status", usersOnline);

  // 🔌 Handle disconnection
  socket.on("disconnect", () => {
    console.log(`${username} disconnected`);
    //find user based on socket id or user id and mark them offline
    const username = socket.user?.username;
    usersOnline[username] = false;
    io.emit("user-status", { userId: username, status: "offline" });
  });

  console.log(`${username} disconnected`);

  // Remove user from both maps
  delete users[username];
  delete userSocketMap[username];
});

// 🧠 MongoDB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// 🚀 Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
