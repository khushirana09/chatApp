import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaCircleUser } from "react-icons/fa6";
import { FaLock } from "react-icons/fa";
import "../styles/Login.css";
 

const Login = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    //send request to backend
    const response = await fetch(
      `https://chatapp-7ybi.onrender.com/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      console.log(localStorage.getItem("token"));
      console.log(localStorage.getItem("username"));
      navigate("/chat");
    } else {
      alert(data.message || "Login failed");
    }
  };

  useEffect(() => {
    const name = localStorage.getItem("tempName") || "";
    const profile = localStorage.getItem("tempAvatar") || "../assets/images/avatar.png";
    setUsername(name);
    setAvatar(profile);
  }, []);

  return (
    <div className="login-container">
      <div className="logn-content">
        <div className="login-screen">
          <div className="profile-pic">
            <img src={avatar} alt="Avatar" width="100" height="100" />
          </div>
          <div className="login-wlcm-msg">
          <h2>Welcome , {username}</h2></div>
          <div className="login-form-container">
          <form className="login-form" action="" onSubmit={handleLogin}>
            <div className="email-input">
            <FaCircleUser />
              <input
                className="Email-field"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="password-input">
            <FaLock />
              <input
                className="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-btn">
              Login
            </button>
            <p>
              <Link to ="/forgot-password">Forgot Password?</Link>
            </p>
          </form>
          </div>
          <div className="register-msg">
          <p>
            No account ?{" "}
            <Link to="/register" className="register-link">
              Register
            </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
