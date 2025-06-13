const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

//userlist
router.get("/all", async (req, res) => {
  try {
    const currentUsername = req.query.currentUsername;

    const users = await User.find(
      { username: { $ne: currentUsername } }, // exclude current
      "username profilePicture email"
    );

    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Register Route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check for missing fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email or username already exists
    const existingEmail = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });

    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res
      .status(201)
      .json({
        message: "User registered successfully",
        username: newUser.username,
      });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "default_secret", // fallback to avoid crashes
      { expiresIn: "5h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      username: user.username,
      profilePicture: user.profilePicture || "",
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
