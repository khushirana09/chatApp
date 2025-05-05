const express = require("express");
const router = express.Router();
const User = require("../models/User");

//Get all users
router.get("/all" , async (req , res) => {
  try{
    const users = await User.find({} , "username");  //return only usernames
    res.json(users);
    } catch (err) {
      res.status(500).json({error: "Failed to fetch users"});

    }
});

// Example route for registration
router.post("/register", (req, res) => {
  res.json({ message: "User registered (dummy)" });
});

// Example route for login
router.post("/login", (req, res) => {
  res.json({ message: "User logged in (dummy)" });
});

module.exports = router;
