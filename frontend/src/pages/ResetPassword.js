import React, { useState, useEffect } from "react";
import axios from "axios";

const ResetPassword = () => {
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setToken(urlParams.get("token"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://chatapp-7ybi.onrender.com/api/auth/reset-password",
        {
          token,
          password, // backend expects: email, token, password
        }
      );
      setMessage(res.data.message);
    } catch (err) {
      setMessage("Invalid or expired link.");
    }
  };

  return (
    <div>
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
      <p>{message}</p>
    </div>
  );
};

export default ResetPassword;
