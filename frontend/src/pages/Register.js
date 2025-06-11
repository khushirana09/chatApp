import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Register.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); //new state
  const [error, setError] = useState(""); //New
  const [tip, setTip] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "💧 Drink some water!",
    "🌿 Take a deep breath.",
    "💪 You’re doing great!",
    "🌞 Get some sunlight!",
    "🧠 Rest your eyes.",
    "😄 Smile a little!",
  ];

  //change tip every few seconds
  useEffect(() => {
    let indexInterval;
    let tipInterval;

    if (loading) {
      setTip(messages[Math.floor(Math.random() * messages.length)]);

      indexInterval = setInterval(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }, 3000);

      tipInterval = setInterval(() => {
        setTip(messages[Math.floor(Math.random() * messages.length)]);
      }, 3000);
    }

    return () => {
      clearInterval(indexInterval);
      clearInterval(tipInterval);
    };
  }, [loading]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setTip(messages[Math.floor(Math.random() * messages.length)]);
    setLoading(true);
    setError(""); // clear previous error
    setSuccess(false); // clear previous success

    try {
      const response = await fetch(
        `https://chat-app-mgo9.onrender.com/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true); // show success overlay
        setTimeout(() => {
          navigate("/login");
        }, 3000); // wait 3 seconds before redirecting
      } else {
        setLoading(false); // 💥 FIXED: stop spinner on error
        setError(data.message || "Registration failed.");
      }
    } catch (error) {
      setLoading(false);
      setError("Server error. Please try again later.");
      console.error("Error during registration:", error);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {loading && (
        <div className="loader-overlay">
          <div className="loader-box">
            <div className="spinner"></div>
            <div className="loader-message">{tip}</div>
          </div>
        </div>
      )}

      {/* success message overlay */}
      {success && (
        <div className="loader-overlay">
          <div className="loader-box">
            <div className="loader-message">🎉 Registered Successfully!</div>
          </div>
        </div>
      )}

      {/* error message only */}
      {error && (
        <div className="loader-overlay" onClick={() => setError("")}>
          <div className="loader-box">
            <div className="loader-message" style={{ color: "red" }}>
              ❌ {error}
            </div>
          </div>
        </div>
      )}

      {loading && !success && !error && (
        <div className="loader-overlay">
          <div className="loader-box">
            <div className="spinner"></div>
            <div className="loader-message">{messages[messageIndex]}</div>
          </div>
        </div>
      )}

      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
