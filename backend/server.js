const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const multer = require("multer");

// Route & Model Imports
const userRoutes = require("./routes/auth");
const userRoute = require("./routes/userRoutes");
const User = require("./models/User");
const Message = require("./models/Message");

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Track typing users & online users
const typingUsers = {};
const usersOnline = {};
const users = {};
const userSocketMap = {};

// Serve uploaded media
app.use("/uploads", express.static("uploads"));

// Multer Setup for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure 'uploads' folder exists
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ File Upload API
app.post("/upload", upload.single("file"), (req, res) => {
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  console.log("File uploaded:", req.file.filename);
  res.status(200).json({
    message: "File uploaded",
    filename: req.file.filename,
    fileUrl,
  });
});

// Allowed frontend origins (Vercel + localhost)
const allowedOrigins = [
  "http://localhost:3000",
  "https://chat-app-bay-chi.vercel.app/",
];


// Express CORS Options
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

// Register Routes
app.use("/api/auth", userRoutes);
app.use("/api/users", userRoute);

//base route test
app.get("/", (req, res) => {
  res.send("API working fine.");
});
// app.use("/api/messages", messageRoute); // Uncomment if used

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// 🔐 Authenticate Socket.IO using JWT
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded; // Attach decoded user info
    next();
  });
});

// 📡 Handle Socket.IO Connections
io.on("connection", (socket) => {
  const username = socket.user.username;
  console.log("A user connected:", socket.id, "Username:", username);

  users[username] = socket.id;
  userSocketMap[username] = socket.id;

  // 🟢 NEW: When a user joins, send the list of online users to all
  socket.on("join", (username) => {
    userSocketMap[username] = socket.id;
    io.emit("onlineUsers", Object.keys(userSocketMap));
  });

  // Online status
  socket.on("user-login", (userId) => {
    usersOnline[username] = true;
    io.emit("user-status", { userId: username, status: "online" });
    console.log(`User ${userId} is now online`);
  });

  // typing event
  socket.on("typing", ({ username }) => {
    socket.broadcast.emit("user-typing", { username });
  });

  socket.on("stop-typing", ({ username }) => {
    socket.broadcast.emit("stop-typing", { username });
  });

  // Private messages
  socket.on("private-message", ({ to, from, message }) => {
    console.log("Private message from", from, "to", to, ":", message);
    const targetSocketId = users[to];
    if (targetSocketId) {
      socket.to(targetSocketId).emit("private-message", { from, message });
    }
  });

  // Message history
  socket.on("getMessages", async () => {
    try {
      const messages = await Message.find({});
      socket.emit("previousMessages", messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  });

  // Public and private chat
  socket.on("chatMessage", async ({ text, to, media }) => {
    const message = new Message({
      sender: username,
      receiver: to,
      message: text,
      media: media || null,
    });

    await message.save();

    const payload = {
      sender: username,
      receiver: to,
      message: text,
      media: media || null,
    };

    if (!to || to === "all") {
      payload.receiver = "all";
      io.emit("chatMessage", payload);
    } else {
      if (userSocketMap[to]) {
        io.to(userSocketMap[to]).emit("chatMessage", payload);
      }
      socket.emit("chatMessage", payload);
    }
  });

  // Initial user status
  socket.emit("initial-user-status", usersOnline);

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`${username} disconnected`);
    usersOnline[username] = false;
    io.emit("user-status", { userId: username, status: "offline" });

    delete users[username];
    delete userSocketMap[username];
    delete typingUsers[socket.id];

    // 🟢 NEW: Update online users after disconnect
    io.emit("onlineUsers", Object.keys(userSocketMap));
  });
});

// 🧠 Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// 🚀 Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
