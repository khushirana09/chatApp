import React, { useState } from "react";
import axios from "axios";
import "../styles/Register.css"; // ✅ Reusing loader styles

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await axios.post(
        "https://chatapp-7ybi.onrender.com/api/auth/forgot-password",
        { email }
      );
      setMessage(res.data.message);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Loader overlay */}
      {loading && (
        <div className="loader-overlay">
          <div className="loader-box">
            <div className="spinner"></div>
            <div className="loader-message">Sending reset link...</div>
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

      {/* Success message */}
      {message && !error && (
        <div className="loader-overlay" onClick={() => setMessage("")}>
          <div className="loader-box">
            <div className="loader-message">✅ {message}</div>
          </div>
        </div>
      )}

      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
};

export default ForgotPassword;
