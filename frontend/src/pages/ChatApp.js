import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

function ChatApp() {
  const navigate = useNavigate();
  const BACKEND_URL = "https://chatapp-7ybi.onrender.com";

  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [username, setUsername] = useState("");
  const [userStatus, setUserStatus] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [onlineUsers, setOnlineUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const { logout } = useAuth();
  const [previewMedia, setPreviewMedia] = useState(null); // blob/file preview
  const [previewType, setPreviewType] = useState(""); // image/video/etc.
  const [selectedMessages, setSelectedMessages] = useState([]);

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
    newSocket.emit("join", storedName);

    fetch(`${BACKEND_URL}/api/users/all?currentUsername=${storedName}`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((u) => u.username !== storedName);
        setUsers(filtered);
      });

    newSocket.emit("getMessages", {
      username: storedName,
    });

    newSocket.on("chatMessage", (data) => {
      const { sender, receiver } = data;
      if (
        receiver === "all" ||
        sender === storedName ||
        receiver === storedName
      ) {
        setAllMessages((prev) => [...prev, data]);
      }
    });

    newSocket.on("previousMessages", (storedMessages) => {
      setAllMessages(storedMessages);
    });

    newSocket.on("initial-user-status", setUserStatus);

    newSocket.on("user-status", (data) => {
      setUserStatus((prev) => ({
        ...prev,
        [data.userId]: data.status,
      }));
    });

    newSocket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
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

  useEffect(() => {
    const filtered = allMessages.filter((msg) => {
      return (
        msg.receiver === "all" ||
        (msg.sender === username && msg.receiver === selectedUser) ||
        (msg.sender === selectedUser && msg.receiver === username)
      );
    });
    setMessages(filtered);
  }, [selectedUser, allMessages, username]);

  useEffect(() => {
    if (socket && username) {
      socket.emit("getMessages", {
        username,
        receiver: selectedUser,
      });
    }
  }, [socket, username, selectedUser]);

  //----------------------inptchange-----------------------
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

  //--------------handlefileupload------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Get type and create local preview
    const type = file.type.split("/")[0]; // image, video, audio
    const localUrl = URL.createObjectURL(file);

    setPreviewType(type);
    setPreviewMedia(localUrl); // set for preview

    // Start Cloudinary upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "chatapp_media_upload");

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dbhafx1li/auto/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      setMediaUrl(data.secure_url);
      setMediaType(type);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  // ------------------handlesend---------------------
  const handleSend = () => {
    if ((message.trim() || mediaUrl) && socket) {
      const newMsg = {
        _id: Date.now().toString(), // temporary unique id
        message: message.trim(),
        sender: username,
        receiver: selectedUser,
        to: selectedUser,
        media: mediaUrl,
        mediaType: mediaType,
      };

      // 1. Emit to server
      socket.emit("chatMessage", newMsg);

      // 2. Optimistically update UI immediately
      setMessages((prev) => [...prev, newMsg]);

      // 3. Reset input fields
      setMessage("");
      setMediaUrl("");
      setMediaType("");
      setPreviewMedia(null);
      setShowPicker(false);
    }
  };

  //--------------------handlelogout------------------
  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }

    logout();
    console.log("Logging out...");
    setTimeout(() => {
      navigate("/login");
    }, 0);
  };

  // ----------------emojipicker-----------------
  const toggleEmojiPicker = () => setShowPicker(!showPicker);

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji.native);
  };

  return (
    <div className="chat-container">
      <h2>Welcome, {username}</h2>

      <div className="chat-content">
        {/* Sidebar */}
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

        {/* Online Users */}
        <div className="online-users">
          <h4>Online Now</h4>
          <ul>
            {Object.keys(onlineUsers).map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg._id} className="message">
              {msg._id && (
                <input
                  type="checkbox"
                  checked={selectedMessages.includes(msg._id)}
                  onChange={() => {
                    setSelectedMessages((prev) =>
                      prev.includes(msg._id)
                        ? prev.filter((id) => id !== msg._id)
                        : [...prev, msg._id]
                    );
                  }}
                />
              )}
              <strong>{msg.sender}</strong>
              {msg.receiver === "all" ? " (Global)" : ""}:&nbsp;
              {msg.message && <span>{msg.message}</span>}
              <span
                className={`status-text ${
                  userStatus[msg.sender] === "online" ? "online" : "offline"
                }`}
              >
                ({userStatus[msg.sender]})
              </span>
              {msg.media && (
                <>
                  {msg.mediaType === "image" ? (
                    <img
                      src={msg.media}
                      alt="uploaded"
                      style={{
                        maxWidth: "200px",
                        display: "block",
                        marginTop: "5px",
                      }}
                    />
                  ) : msg.mediaType === "video" ? (
                    <video
                      controls
                      src={msg.media}
                      style={{ maxWidth: "200px" }}
                    />
                  ) : msg.mediaType === "audio" ? (
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

          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.join(", ")} is typing...
            </div>
          )}

          {selectedMessages.length > 0 && (
            <button
              onClick={() => {
                const updated = messages.filter(
                  (msg) => !selectedMessages.includes(msg._id)
                );
                setMessages(updated);

                //optional emit delete to server
                if (socket && selectedMessages.length > 0) {
                  socket.emit("deleteMessages", {
                    ids: selectedMessages,
                    sender: username,
                  });
                }
                setSelectedMessages([]);
              }}
            >
              🗑️ Delete Selected ({selectedMessages.length})
            </button>
          )}
        </div>

        {/* Input Area */}
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
            id="fileInput"
            type="file"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          {/* preview */}
          {previewMedia && (
            <div className="media-preview">
              {previewType === "image" ? (
                <img
                  src={previewMedia}
                  alt="preview"
                  style={{ maxWidth: "200px" }}
                />
              ) : previewType === "video" ? (
                <video
                  src={previewMedia}
                  controls
                  style={{ maxWidth: "200px" }}
                />
              ) : previewType === "audio" ? (
                <audio src={previewMedia} controls />
              ) : (
                <p>📄 File ready to upload</p>
              )}
            </div>
          )}

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
