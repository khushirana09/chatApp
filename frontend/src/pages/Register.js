import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Register.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tip, setTip] = useState("");
  const navigate = useNavigate();

  const messages = [
    "💧 Drink some water!",
    "🌿 Take a deep breath.",
    "💪 You’re doing great!",
    "🌞 Get some sunlight!",
    "🧠 Rest your eyes.",
    "😄 Smile a little!",
  ];

  useEffect(() => {
    let tipInterval;
    if (loading) {
      setTip(messages[Math.floor(Math.random() * messages.length)]);
      tipInterval = setInterval(() => {
        setTip(messages[Math.floor(Math.random() * messages.length)]);
      }, 3000);
    }
    return () => clearInterval(tipInterval);
  }, [loading]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        `https://chatapp-7ybi.onrender.com/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setLoading(false);
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      setLoading(false);
      setError("Server error. Please try again later.");
      console.error("Error during registration:", err);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* ✅ Loading Overlay */}
      {loading && !success && !error && (
        <div className="loader-overlay">
          <div className="loader-box">
            <div className="spinner"></div>
            <div className="loader-message">{tip}</div>
          </div>
        </div>
      )}

      {/* ✅ Success Overlay */}
      {success && (
        <div className="loader-overlay">
          <div className="loader-box">
            <div className="loader-message">🎉 Registered Successfully!</div>
          </div>
        </div>
      )}

      {/* ✅ Error Overlay */}
      {error && (
        <div className="loader-overlay" onClick={() => setError("")}>
          <div className="loader-box">
            <div className="loader-message" style={{ color: "red" }}>
              ❌ {error}
            </div>
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
