import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatApp from "./pages/ChatApp";

function App() {
  const isLoggedIn = !!localStorage.getItem("token");
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={isLoggedIn ? <ChatApp /> : <Navigate to="/login" />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
       <Route path="/chat" element={<ChatApp />} />
       <Route path="*" element={<Login />} />    {/* fallback route */}
      </Routes>
    </Router>
  );
}

export default App;
