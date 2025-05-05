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
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {username}</h2>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* 👥 Sidebar: Users list */}
        <div style={{ width: "200px", borderRight: "1px solid gray" }}>
          <h4>Users</h4>
          <div
            style={{ cursor: "pointer", fontWeight: selectedUser === "all" ? "bold" : "normal" }}
            onClick={() => setSelectedUser("all")}
          >
            🌐 Global Chat
          </div>
          {users.map((u, i) => (
            <div
              key={i}
              style={{ cursor: "pointer", fontWeight: selectedUser === u.username ? "bold" : "normal" }}
              onClick={() => setSelectedUser(u.username)}
            >
              {u.username}
            </div>
          ))}
        </div>

        {/* 💬 Main Chat Box */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            {messages.map((msg, index) => (
              <div key={index}>
                {msg.receiver === "all" ? (
                  <div>
                    <b>{msg.sender}</b> (Global): {msg.message}
                  </div>
                ) : (
                  <div>
                    <b>{msg.sender}</b> ➡️ <b>{msg.receiver}</b>: {msg.message}
                  </div>
                )}
              </div>
            ))}
          </div>

          {typing && typing !== username && (
            <div style={{ fontStyle: "italic", marginBottom: "5px" }}>
              {typing} is typing...
            </div>
          )}

          {/* 📝 Message input */}
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleTyping}
            placeholder={`Message to ${selectedUser}`}
            style={{ width: "70%", padding: "5px" }}
          />
          <button onClick={handleSend} style={{ marginLeft: "10px" }}>
            Send
          </button>
          <button onClick={handleLogout} style={{ marginLeft: "10px", backgroundColor: "tomato" }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;
