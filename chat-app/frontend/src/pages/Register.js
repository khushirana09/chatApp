import React, { useState } from "react";
import { useNavigate , Link } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    console.log("Registering with:", { username, email, password });
    const data = await response.json();

    if (response.ok) {
      alert("Registered sucessfully! Please log in.");
      navigate("/login");
    } else {
      alert(data.message || "Registration failed");
    }
  };
  return <div>
    <h2>Register</h2>
    <form action="" onSubmit={handleRegister}>
        <input type="text" placeholder="Username" value={username} onChange={(e) =>setUsername(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Register</button>
    </form>
    <p>Already have an account ? <Link to ="/login">Login</Link></p>
  </div>;
};

export default Register;
