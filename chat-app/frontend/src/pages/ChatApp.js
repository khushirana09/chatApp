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
  const [typingUsers, setTypingUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [username, setUsername] = useState("");
  const [userStatus, setUserStatus] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null); // media upload

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

    newSocket.on("typing", (typingUsers) => {
      const othersTyping = typingUsers.filter((u) => u !== storedName);
      setTypingUsers(othersTyping);
    });

    // 👥 Multiple users typing (optional)
    newSocket.on("typing", (typingUsers) => {
      const othersTyping = typingUsers.filter((u) => u !== storedName);
      setTypingUsers(othersTyping);
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

  //fileupload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json(); // fails if server sends HTML INSTEAD OF JSON
      setMediaUrl(data.fileUrl); // Save to state
    } catch (error) {
      console.error("File upload failed", error);
    }
  };

  // 📤 Send message
  const handleSend = () => {
    if ((message.trim() || mediaUrl) && socket) {
      socket.emit("chatMessage", {
        text: message,
        to: selectedUser,
        media: mediaUrl,
      });
      setMessage("");
      setMediaUrl(null); // Clear after sending
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

          {/* 🌐 Global Chat Option */}
          <div
            className={`user-option ${selectedUser === "all" ? "active" : ""}`}
            onClick={() => setSelectedUser("all")}
          >
            🌐 Global Chat
          </div>

          {/* 🧑‍🤝‍🧑 List of Users */}
          {users.map((user) => (
            <div
              key={user.username}
              className={`user-item ${
                selectedUser === user.username ? "selected" : ""
              }`}
              onClick={() => setSelectedUser(user.username)}
            >
              <span>{user.username}</span>
              <span
                className={`status-dot ${
                  userStatus[user.username] === "online" ? "online" : "offline"
                }`}
              ></span>
            </div>
          ))}
        </div>

        {/* 💬 Main Chat Area */}
        <div className="chat-main">
          {/* 📜 Message List */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                {/* 🌍 Global or Private Message */}
                {msg.receiver === "all" ? (
                  <div>
                    <b>{msg.sender}</b> (Global): {msg.text}
                  </div>
                ) : (
                  <div>
                    <b>{msg.sender}</b> ➡️ <b>{msg.receiver}</b>: {msg.text}
                  </div>
                )}

                {/* 📶 Online/Offline Status */}
                <span
                  className={`status-text ${
                    userStatus[msg.sender] === "online" ? "online" : "offline"
                  }`}
                >
                  ({userStatus[msg.sender] === "online" ? "Online" : "Offline"})
                </span>

                {/* 📎 Media Attachments */}
                {msg.media && (
                  <>
                    {msg.media.endsWith(".jpg") ||
                    msg.media.endsWith(".png") ? (
                      <img src={msg.media} alt="uploaded" />
                    ) : msg.media.endsWith(".mp4") ? (
                      <video controls src={msg.media} />
                    ) : msg.media.endsWith(".mp3") ? (
                      <audio controls src={msg.media}></audio>
                    ) : (
                      <a
                        href={msg.media}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View File
                      </a>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* ✍️ Typing Status */}
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                {typingUsers.join(",")} is typing...
              </div>
            )}
          </div>

          {/* 📥 Input Section */}
          <div className="chat-input">
            {/* 😊 Emoji Picker Button */}
            <button onClick={toggleEmojiPicker}>😊</button>

            {/* 😃 Emoji Picker */}
            {showPicker && (
              <div className="emoji-picker">
                <Picker data={data} onEmojiSelect={addEmoji} />
              </div>
            )}

            {/* ✏️ Text Input */}
            <input
              value={message}
              onChange={handleInputChange}
              onKeyDown={() => socket?.emit("typing", username)}
              placeholder={`Message to ${selectedUser}`}
            />

            {/* 📎 File Upload */}
            <label htmlFor="fileInput" className="upload-button">
              📎
            </label>
            <input
              type="file"
              id="fileInput"
              style={{ display: "none" }}
              accept="image/*,video/*,audio/*"
              onChange={handleFileUpload}
            />

            {/* 📤 Send Button */}
            <button onClick={handleSend}>Send</button>

            {/* 🚪 Logout Button */}
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
