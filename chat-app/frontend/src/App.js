import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatApp from "./pages/ChatApp";
import WelcomeName from "./pages/WelcomeName";
import SelectAvatar from "./pages/SelectAvatar";

function App() {
 // const isLoggedIn = !!localStorage.getItem("token");
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomeName />} />
        <Route path="/welcome" element={<WelcomeName />} />
        <Route path="select-avatar" element={<SelectAvatar />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<ChatApp />} />
        <Route path="*" element={<Login />} /> {/* fallback route */}
      </Routes>
    </Router>
  );
}

export default App;
