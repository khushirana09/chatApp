import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css"; // 🔁 Reuse the same loader styles

const messages = [
  "💧 Drink some water!",
  "🌿 Take a deep breath.",
  "💪 You’re doing great!",
  "🌞 Get some sunlight!",
  "🧠 Rest your eyes.",
  "😄 Smile a little!",
];

const ResetPassword = () => {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromURL = urlParams.get("token");

    if (!tokenFromURL) {
      setError("❌ Invalid or missing reset token.");
      return;
    }
    setToken(tokenFromURL);
  }, []);

  useEffect(() => {
    let tipInterval;

    if (loading && !success && !error) {
      setMessageIndex(0); // Start from first tip

      tipInterval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 3000);
    }

    return () => clearInterval(tipInterval);
  }, [loading, success, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        "https://chatapp-7ybi.onrender.com/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            newPassword: password,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage(data.message);
        setLoading(false); // ✅ Stop spinner before showing message
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setLoading(false);
        setError(data.message || "Invalid or expired reset link.");
      }
    } catch (err) {
      setLoading(false);
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Loading overlay */}
      {loading && !success && !error && (
        <div className="loader-overlay">
          <div className="loader-box">
            <div className="spinner"></div>
            <div className="loader-message fade-in">
              {messages[messageIndex]}
            </div>
          </div>
        </div>
      )}

      {/* Success message overlay */}
      {message && !error && (
        <div className="loader-overlay">
          <div className="loader-box">
            <div className="loader-message">✅ {message}</div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="loader-overlay" onClick={() => setError("")}>
          <div className="loader-box">
            <div className="loader-message" style={{ color: "red" }}>
              ❌ {error}
            </div>
          </div>
        </div>
      )}

      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;
