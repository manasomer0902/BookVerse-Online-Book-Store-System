const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

/* =====================
   SIGNUP API
===================== */
router.post("/signup", async (req, res) => {
  try {
    const { name, emailOrPhone, password } = req.body;

    if (!name || !emailOrPhone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let email = null;
    let phone = null;

    if (emailOrPhone.includes("@")) {
      if (!emailOrPhone.includes(".")) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      email = emailOrPhone.toLowerCase();
    } else {
      if (!/^\d{10}$/.test(emailOrPhone)) {
        return res.status(400).json({ message: "Phone number must be 10 digits" });
      }
      phone = emailOrPhone;
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({ message: "Signup successful" });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================
   LOGIN API  ✅ ADD THIS
===================== */
router.post("/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let user;

    if (emailOrPhone.includes("@")) {
      user = await User.findOne({ email: emailOrPhone.toLowerCase() });
    } else {
      user = await User.findOne({ phone: emailOrPhone });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
