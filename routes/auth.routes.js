const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

/* =====================
   SIGNUP
===================== */
router.post("/signup", async (req, res) => {
  try {
    const { name, emailOrPhone, password } = req.body;

    if (!name || !emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    let email = null;
    let phone = null;

    if (emailOrPhone.includes("@")) {
      email = emailOrPhone.toLowerCase();
    } else {
      phone = emailOrPhone;
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Signup successful"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =====================
   LOGIN
===================== */
router.post("/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    let user;

    if (emailOrPhone.includes("@")) {
      user = await User.findOne({ email: emailOrPhone.toLowerCase() });
    } else {
      user = await User.findOne({ phone: emailOrPhone });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
