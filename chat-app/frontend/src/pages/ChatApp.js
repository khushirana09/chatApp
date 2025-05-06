import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

function ChatApp() {
  const navigate = useNavigate();

  // State hooks
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [username, setUsername] = useState("");
  const [userStatus, setUserStatus] = useState({}); //show online and offline status

  const BACKEND_URL = "https://chat-app-mgo9.onrender.com";

  // 🔌 Establish socket connection and fetch users/messages
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedName = localStorage.getItem("username");

    if (!token || !storedName) {
      navigate("/login");
      return;
    }

    setUsername(storedName);

    const newSocket = io(BACKEND_URL, {
      query: { token },
    });
    setSocket(newSocket);
    newSocket.emit("user-login", storedName);

    // 🔽 Fetch all users except self
    fetch(`${BACKEND_URL}/api/users/all`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((u) => u.username !== storedName);
        setUsers(filtered);
      });

    // 🔄 Request stored messages from server
    newSocket.emit("getMessages");

    // 📥 Handle new and previous messages
    newSocket.on("chatMessage", (data) => {
      const { sender, receiver } = data;

      // Only show:
      // 1. Global messages
      // 2. Messages sent/received by the logged-in user
      if (
        receiver === "all" ||
        sender === storedName ||
        receiver === storedName
      ) {
        setMessages((prev) => [...prev, data]);
      }
    });

    newSocket.on("previousMessages", (storedMessages) => {
      const relevantMessages = storedMessages.filter(
        (msg) =>
          msg.receiver === "all" ||
          msg.sender === storedName ||
          msg.receiver === storedName
      );
      setMessages(relevantMessages);
    });

    //online and offline status

    newSocket.on("initial-user-status", (data) => {
      //update the UI based on data status
      setUserStatus(data);
    });

    const updateUserStatus = (data) => {
      setUserStatus((prevStatus) => ({
        ...prevStatus,
        [data.userId]: data.status,
      }));
    };
    newSocket.on("user-status", updateUserStatus);

    // ✍️ Typing indicator
    newSocket.on("typing", (user) => {
      setTyping(user);
    });
    newSocket.on("stopTyping", () => {
      setTyping(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  // 📤 Send chat message
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

  // 🟡 Typing event
  const handleTyping = () => {
    socket?.emit("typing");
    setTimeout(() => {
      socket?.emit("stopTyping");
    }, 1000);
  };

  // ⛔ Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="chat-container">
      <h2>Welcome, {username}</h2>

      <div className="chat-content">
        {/* 👥 Sidebar: Users list */}
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
              {/* online and offline status inidcator */}
              <span
                className={`status-indicator ${
                  userStatus[u.username] === "online" ? "online" : "offline"
                }`}
              ></span>
              {u.username}
            </div>
          ))}
        </div>

        {/* 💬 Main Chat Box */}
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

                {/* show online/offline status next to the sender */}
                <span
                  className={`status-text ${
                    userStatus[msg.sender] === "online" ? "online" : "offline"
                  }`}
                >
                  ({userStatus[msg.sender] === "online" ? "Online" : "Offline"}){" "}
                </span>
              </div>
            ))}
          </div>

          {typing && typing !== username && (
            <div className="typing-indicator">{typing} is typing...</div>
          )}

          {/* 📝 Message input */}
          <div className="chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleTyping}
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
