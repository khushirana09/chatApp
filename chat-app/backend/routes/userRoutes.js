const express = require("express");
const router = express.Router();
const User = require("../models/User");

//Get all users
router.get("/all", async (req, res) => {
  try {
    const users = await User.find({}, "username"); //return only usernames
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Example route for registration
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "Username already exists" });

    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({ message: "Registered successfully!" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// Example route for login
router.post("/login", (req, res) => {
  res.json({ message: "User logged in (dummy)" });
});

module.exports = router;
