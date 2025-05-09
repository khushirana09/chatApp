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
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return re.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      username: user.username,
      profilePicture: user.profilePicture || "",   // return profile picture url
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error " });
  }
});

module.exports = router;
