import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function WelcomeName() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => {
    return localStorage.getItem("tempName") || "";
  });

  //Load saved name on components mount

  useEffect(() => {
    localStorage.setItem("tempName", name);
  }, [name]);

  const handleNext = () => {
    if (!name.trim()) return alert("please enter your name.");
    //already saved in useeffect 
    navigate("/select-avatar");
  };

  return (
    <div className="welcome-screen">
      <h1>👋 Welcome to My Chat App</h1>
      <p>Hi! What's your name?</p>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleNext}>Next</button>
    </div>
  );
}

export default WelcomeName;
