import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

// Socket connection setup
const socket = io(); // automatically connnects to the same domain/port

const ChatApp = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [privateMessageTarget, setPrivateMessageTarget] = useState(null);
  const [typingUser, setTypingUser] = useState("");

  const navigate = useNavigate(); // treack if prompt already shown

  //show typing
  const handleTyping = () => {
    socket.emit("typing", username);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      //if no username found , redirect to login page
      navigate("/login");
    }

    const storedName = localStorage.getItem("username");
    if (!storedName) {
      navigate("/login");
      return;
    }

    setUsername(storedName);
    socket.emit("setUsername", storedName);

    //clear previous listeners (prevent duplicates)
    // First: clear previous listeners
    socket.off("chatMessage");
    socket.off("updateUserList");

    // Listen for incoming chat messages
    socket.on("chatMessage", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    //show typing messages

    socket.on("typing", (username) => {
      setTypingUser(username);
    });

    // display chat history
    socket.on("chatHistory", (messages) => {
      setMessages(messages);
    });

    // Listen for the user list update
    socket.on("updateUserList", (userList) => {
      setUsers(userList);
    });

    // Notify when the user disconnects
    return () => {
      socket.off("chatMessages");
      socket.off("updateUserList");
      socket.off("chatHistory");
      socket.off("typing");
    };
  }, [navigate]);

  //submit button
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message) {
      socket.emit("chatMessage", message, privateMessageTarget); // ✅ only send message text  and private message
    } else {
      socket.emit("chatMessage", message); //send public message
    }
    setMessage("");
  };

  //logout button
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div id="user-list-container">
      <h1>Mini Chat 🚀</h1>

      <h4>Logged in as: {username}</h4>
      <h3>Users:</h3>
      <ul id="user-list">
        {users.map((user, index) => (
          <li key={index} onClick={() => setPrivateMessageTarget(user)}>
            {user} {privateMessageTarget}
            {typingUser && <p><em>{typingUser} is typing...</em></p>}
          </li>
        ))}
      </ul>

      <ul id="messages">
        {messages.map((msg, index) => (
          <li key={index}>
            <strong>{msg.user}:</strong> {msg.text}
          </li>
        ))}
      </ul>

      <form id="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          id="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleTyping}
          placeholder="Type your message..."
        />
        <button>Send</button>
        <button onClick={handleLogout}>Logout</button>
      </form>
    </div>
  );
};

export default ChatApp;
