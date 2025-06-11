import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SelectAvatar() {
  const [avatar, setAvatar] = useState(null);
  const navigate = useNavigate();

  //load avatar if it exists
  useEffect(() => {
    const savedAvatar = localStorage.getItem("tempAvatar");
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setAvatar(base64);
        localStorage.setItem("tempAvatar", base64); //save base64 to locastorage
      };
      reader.readAsDataURL(file); //convert to base 64
    }
  };

  const handleNext = () => {
    navigate("/login");
  };

  const handleBack = () => {
    navigate("/welcome");
  };

  const handleSkip = () => {
    localStorage.setItem("tempAvatar", "/default-avatar.png");
    navigate("/login");
  };

  return (
    <div className="avatar-screen">
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSkip}>Skip</button>
      </div>
      <h2>Upload or choose Your Avatar</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {avatar && <img src={avatar} alt="Preview" width="100" height="100" />}
      <div>
        <button onClick={handleBack}>Back</button>
        <button onClick={handleNext}>Next</button>
      </div>
    </div>
  );
}

export default SelectAvatar;
