import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

function ChatApp() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all"); //default to all
  const [username, setUsername] = useState("");
  const BACKEND_URL = "https://chat-app-mgo9.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedName = localStorage.getItem("username");

    if (!token || !storedName) {
      navigate("/login");
      return;
    }

    setUsername(storedName);

    const newSocket = io(`${BACKEND_URL}`, {
      query: { token },
    });

    setSocket(newSocket);

    //fetch user
    fetch(`${BACKEND_URL}/api/users/all`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((u) => u.username !== storedName); //exclude self
        setUsers(filtered);
      });

    newSocket.emit("setUsername", storedName);

    // ✅ Ask backend to send stored messages
    newSocket.emit("getMessages");

    newSocket.on("chatMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });
    newSocket.on("previousMessages", (storedMessages) => {
      setMessages(storedMessages);
    });

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

  const handleSend = () => {
    if (message.trim() && socket) {
      socket.emit("chatMessage", { text: message, to: selectedUser });
      setMessage("");
      socket.emit("stopTyping");
    }
  };

  const handleTyping = () => {
    socket?.emit("typing");
    setTimeout(() => {
      socket?.emit("stopTyping");
    }, 1000);
  };

  return (
    <div>
      <h2>Welcome, {username}</h2>
      <div style={{ display: "flex" }}>
        <div style={{ width: "200px", borderRight: "1px solid gray" }}>
          <h4>Users</h4>
          <div onClick={() => setSelectedUser("all")}>🌐 Global Chat</div>
          {users.map((u, i) => (
            <div key={i} onClick={() => setSelectedUser(u.username)}>
              {u.username}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          flex: 1,
          padding: "10px",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index}>
            <b>{msg.sender || msg.user}</b>: {msg.message || msg.text}
          </div>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleTyping}
      />
      <button onClick={handleSend}>Send</button>
      <button
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          navigate("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default ChatApp;
