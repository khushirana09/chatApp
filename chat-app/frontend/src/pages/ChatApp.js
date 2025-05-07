import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

function ChatApp() {
  const navigate = useNavigate();

  // 🌐 Backend server URL
  const BACKEND_URL = "https://chat-app-mgo9.onrender.com";

  // 📦 App state hooks
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [username, setUsername] = useState("");
  const [userStatus, setUserStatus] = useState({});
  const [showPicker, setShowPicker] = useState(false);

  // ✅ Setup and teardown
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedName = localStorage.getItem("username");

    // 🔐 If no auth, redirect to login
    if (!token || !storedName) {
      navigate("/login");
      return;
    }

    setUsername(storedName);

    // 🔌 Connect to backend with auth token
    const newSocket = io(BACKEND_URL, {
      query: { token },
    });
    setSocket(newSocket);

    // 📤 Notify server that user logged in
    newSocket.emit("user-login", storedName);

    // 📦 Fetch all users except current user
    fetch(`${BACKEND_URL}/api/users/all`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((u) => u.username !== storedName);
        setUsers(filtered);
      });

    // 💬 Request stored messages from server
    newSocket.emit("getMessages");

    // 📨 Receive chat message
    newSocket.on("chatMessage", (data) => {
      const { sender, receiver } = data;

      // Only show relevant messages
      if (
        receiver === "all" ||
        sender === storedName ||
        receiver === storedName
      ) {
        setMessages((prev) => [...prev, data]);
      }
    });

    // 💾 Load previous messages
    newSocket.on("previousMessages", (storedMessages) => {
      const relevant = storedMessages.filter(
        (msg) =>
          msg.receiver === "all" ||
          msg.sender === storedName ||
          msg.receiver === storedName
      );
      setMessages(relevant);
    });

    // 🔄 Receive initial online/offline status
    newSocket.on("initial-user-status", (data) => {
      setUserStatus(data);
    });

    // 🚦 Update online/offline status
    newSocket.on("user-status", (data) => {
      setUserStatus((prev) => ({
        ...prev,
        [data.userId]: data.status,
      }));
    });

    // ✍️ Typing indicators from other users
    newSocket.on("typing", (user) => {
      if (user !== storedName) setTyping(user);
    });

    newSocket.on("stopTyping", () => {
      setTyping(false);
    });

    // 👥 Multiple users typing (optional)
    newSocket.on("typingUsers", (typingUsers) => {
      setTypingUsers(typingUsers);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  // 📝 Handle message input change
  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);

    if (text !== "") {
      socket?.emit("typing", username); // typing started
    } else {
      socket?.emit("stopTyping", username); // typing stopped
    }
  };

  // 📤 Send message
  const handleSend = () => {
    if (message.trim() && socket) {
      socket.emit("chatMessage", {
        text: message,
        to: selectedUser,
      });
      setMessage("");
      socket.emit("stopTyping");
    }
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  // 😊 Toggle emoji picker
  const toggleEmojiPicker = () => {
    setShowPicker(!showPicker);
  };

  // 😄 Add emoji to message
  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji.native);
  };

  return (
    <div className="chat-container">
      <h2>Welcome, {username}</h2>

      <div className="chat-content">
        {/* 👥 Sidebar with Users */}
        <div className="chat-sidebar">
          <h4>Users</h4>
          <div
            className={`user-option ${selectedUser === "all" ? "active" : ""}`}
            onClick={() => setSelectedUser("all")}
          >
            🌐 Global Chat
          </div>
          {users.map((u, i) => (
            <div
              key={i}
              className={`user-option ${
                selectedUser === u.username ? "active" : ""
              }`}
              onClick={() => setSelectedUser(u.username)}
            >
              <span
                className={`status-indicator ${
                  userStatus[u.username] === "online" ? "online" : "offline"
                }`}
              ></span>
              {u.username}
            </div>
          ))}
        </div>

        {/* 💬 Chat Area */}
        <div className="chat-main">
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                {msg.receiver === "all" ? (
                  <div>
                    <b>{msg.sender}</b> (Global): {msg.message}
                  </div>
                ) : (
                  <div>
                    <b>{msg.sender}</b> ➡️ <b>{msg.receiver}</b>: {msg.message}
                  </div>
                )}
                <span
                  className={`status-text ${
                    userStatus[msg.sender] === "online" ? "online" : "offline"
                  }`}
                >
                  ({userStatus[msg.sender] === "online" ? "Online" : "Offline"})
                </span>
              </div>
            ))}
          </div>

          {/* ✍️ Typing status */}
          {typing && typing !== username && (
            <div className="typing-indicator">{typing} is typing...</div>
          )}

          {/* 📥 Input section */}
          <div className="chat-input">
            <button onClick={toggleEmojiPicker}>😊</button>
            {showPicker && (
              <div className="emoji-picker">
                <Picker data={data} onEmojiSelect={addEmoji} />
              </div>
            )}

            <input
              value={message}
              onChange={handleInputChange}
              onKeyDown={() => socket?.emit("typing", username)}
              placeholder={`Message to ${selectedUser}`}
            />
            <button onClick={handleSend}>Send</button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;
