const express = require("express");
const router = express.Router();

// Example route for registration
router.post("/register", (req, res) => {
  res.json({ message: "User registered (dummy)" });
});

// Example route for login
router.post("/login", (req, res) => {
  res.json({ message: "User logged in (dummy)" });
});

module.exports = router;
