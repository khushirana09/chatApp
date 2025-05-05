const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const userSocketMap = {};

const userRoutes = require("./routes/auth");
const userRoute = require("./routes/userRoutes");
//const messageRoute = require("./routes/messageRoutes");

const User = require("./models/User");
const Message = require("./models/Message");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://chat-app-indol-ten.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

const allowedOrigins = [
  "http://localhost:3000",
  "https://chat-app-indol-ten.vercel.app",
];

// ✅ Proper CORS middleware
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

app.use(express.json()); // Parses incoming JSON
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", userRoute);
//app.use("/api/messages", messageRoute);

// 🔐 Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded;
    next();
  });
});

// 💬 Socket.IO Chat Handling
io.on("connection", (socket) => {

  const username = socket.user.username;
  userSocketMap[username] = socket.id;


  socket.on("getMessages", async () => {
    try {
      const messages = await Message.find().sort({ createdAt: 1 }); // sort oldest to newest
      socket.emit("previousMessages", messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  });

  socket.on("chatMessage", async ({ text, to }) => {
    const message = new Message({
      sender: socket.user.username,
      receiver: to,
      message: text,
    });
    await message.save();

    const payload = {
      sender: socket.username,
      receiver: to,
      message: text,
    };

    if (to === "all") {
      io.emit("chatMessage", payload);
    } else {
      //send to the receiver
      if (userSocketMap[to]) {
        io.to(userSocketMap[to]).emit("chatMessage", payload);
      }
      //send to sender as well
      socket.emit("chatMessage", payload);
    }
  });

  socket.on("disconnect", () => {
    delete userSocketMap[username];
  });
});

// 🌐 MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// 🚀 Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
