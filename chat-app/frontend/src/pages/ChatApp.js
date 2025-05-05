import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

function ChatApp() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
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

    newSocket.emit("setUsername", storedName);

    newSocket.on("chatMessage", (data) => {
      setMessages((prev) => [...prev, data]);
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
      socket.emit("chatMessage", { text: message, to: "all" });
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
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <b>{msg.user}</b>: {msg.text}
          </div>
        ))}
        {typing && <p>{typing} is typing...</p>}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleTyping}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default ChatApp;
