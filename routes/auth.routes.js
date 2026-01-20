const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

/* =====================
   SIGNUP (STUDENT ONLY)
===================== */
router.post("/signup", async (req, res) => {
  try {
    const { name, emailOrPhone, password } = req.body;

    if (!name || !emailOrPhone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ emailOrPhone });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      name,
      emailOrPhone,
      password: hash,
      role: "student"
    });

    res.status(201).json({ message: "Signup successful" });

  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================
   LOGIN (ROLE BASED)
===================== */
router.post("/login", async (req, res) => {
  try {
    const { emailOrPhone, password, role } = req.body;

    if (!emailOrPhone || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ emailOrPhone: emailOrPhone.trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: "Access denied for selected role" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
