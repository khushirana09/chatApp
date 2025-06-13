import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

function ChatApp() {
  const navigate = useNavigate();
  const BACKEND_URL = "https://chatapp-7ybi.onrender.com";

  // 🔧 State setup
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [username, setUsername] = useState("");
  const [userStatus, setUserStatus] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);
  const typingTimeoutRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  // 🚀 On mount: connect socket, fetch users/messages
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedName = localStorage.getItem("username");

    if (!token || !storedName) {
      navigate("/login");
      return;
    }

    setUsername(storedName);

    const newSocket = io(BACKEND_URL, { query: { token } });
    setSocket(newSocket);

    newSocket.emit("user-login", storedName);
    newSocket.emit("join", storedName); // 🟢 new emit for tracking online users

    fetch(`${BACKEND_URL}/api/users/all`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched users:", data);
        const filtered = data.filter((u) => u.username !== storedName);
        setUsers(filtered);
      });

    newSocket.emit("getMessages");

    newSocket.on("chatMessage", (data) => {
      const { sender, receiver } = data;
      if (
        receiver === "all" ||
        sender === storedName ||
        receiver === storedName
      ) {
        setMessages((prev) => [...prev, data]);
      }
    });

    newSocket.on("previousMessages", (storedMessages) => {
      const relevant = storedMessages.filter(
        (msg) =>
          msg.receiver === "all" ||
          msg.sender === storedName ||
          msg.receiver === storedName
      );
      setMessages(relevant);
    });

    newSocket.on("initial-user-status", setUserStatus);

    newSocket.on("user-status", (data) => {
      setUserStatus((prev) => ({
        ...prev,
        [data.userId]: data.status,
      }));
    });

    newSocket.on("onlineUsers", (users) => {
      setOnlineUsers(users); // 🟢 NEW listener added
    });

    newSocket.on("user-typing", ({ username: typingName }) => {
      if (typingName !== storedName) {
        setTypingUsers([typingName]);
      }
    });

    newSocket.on("stop-typing", ({ username: typingName }) => {
      if (typingName !== storedName) {
        setTypingUsers([]);
      }
    });

    return () => newSocket.disconnect();
  }, [navigate]);

  // 🖊️ Handle message input
  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);
    if (text !== "") {
      socket?.emit("typing", { username });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket?.emit("stop-typing", { username });
      }, 1000);
    } else {
      socket?.emit("stop-typing", { username });
    }
  };

  // 📁 File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setMediaUrl(data.fileUrl);

      // Send media as a chat message
      socket?.emit("chatMessage", {
        text: "",
        to: selectedUser,
        media: data.fileUrl,
      });
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  // 📤 Send message
  const handleSend = () => {
    if ((message.trim() || mediaUrl) && socket) {
      socket.emit("chatMessage", {
        text: message.trim(),
        to: selectedUser,
        media: mediaUrl,
      });

      setMessage("");
      setMediaUrl(null);
      setShowPicker(false);
    }
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  // 😊 Emoji picker toggle
  const toggleEmojiPicker = () => setShowPicker(!showPicker);

  // 😄 Add emoji to text
  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji.native);
  };

  return (
    <div className="chat-container">
      <h2>Welcome, {username}</h2>

      <div className="chat-content">
        {/* 🧍 Sidebar: User list */}
        <div className="chat-sidebar">
          <h4>Users</h4>

          <div
            className={`user-option ${selectedUser === "all" ? "active" : ""}`}
            onClick={() => setSelectedUser("all")}
          >
            🌐 Global Chat
          </div>

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

        {/* online users */}
        <div className="online-users">
          <h4>Online Now</h4>
          <ul>
            {Object.keys(onlineUsers).map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>

        {/* 💬 Chat Area */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              <strong>{msg.sender}</strong>
              {msg.receiver === "all" ? " (Global) " : ""}:&nbsp;
              {msg.message && <span>{msg.message}</span>}
              {/* ✅ Show online/offline status */}
              <span
                className={`status-text ${
                  userStatus[msg.sender] === "online" ? "online" : "offline"
                }`}
              >
                ({userStatus[msg.sender]})
              </span>
              {/* 📎 Media support */}
              {msg.media && (
                <>
                  {msg.media.match(/\.(jpg|png)$/) ? (
                    <img
                      src={msg.media}
                      alt="uploaded"
                      style={{
                        maxWidth: "200px",
                        display: "block",
                        marginTop: "5px",
                      }}
                    />
                  ) : msg.media.endsWith(".mp4") ? (
                    <video
                      controls
                      src={msg.media}
                      style={{ maxWidth: "200px" }}
                    />
                  ) : msg.media.endsWith(".mp3") ? (
                    <audio controls src={msg.media}></audio>
                  ) : (
                    <a href={msg.media} target="_blank" rel="noreferrer">
                      View File
                    </a>
                  )}
                </>
              )}
            </div>
          ))}

          {/* ✍️ Typing status */}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.join(", ")} is typing...
            </div>
          )}
        </div>

        {/* 🖊️ Input Area */}
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
            placeholder={`Message to ${selectedUser}`}
          />

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

          <button onClick={handleSend}>Send</button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;
