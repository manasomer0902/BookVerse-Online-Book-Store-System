const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();

/* ================= EMAIL ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ================= SEND OTP ================= */
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ emailOrPhone: email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = generateOTP();

  user.resetOTP = otp;
  user.resetOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save();

  await transporter.sendMail({
    to: email,
    subject: "BookVerse OTP",
    html: `<h3>Your OTP: ${otp}</h3><p>Valid for 10 minutes</p>`
  });

  res.json({ message: "OTP sent successfully" });
});

/* ================= VERIFY OTP ================= */
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ emailOrPhone: email });

  if (
    !user ||
    user.resetOTP !== otp ||
    user.resetOTPExpiry < Date.now()
  ) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  res.json({ message: "OTP verified" });
});

/* ================= RESEND OTP ================= */
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ emailOrPhone: email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = generateOTP();

  user.resetOTP = otp;
  user.resetOTPExpiry = Date.now() + 10 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
    to: email,
    subject: "New BookVerse OTP",
    html: `<h3>Your new OTP: ${otp}</h3>`
  });

  res.json({ message: "OTP resent successfully" });
});

/* ================= RESET PASSWORD ================= */
router.post("/reset", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ emailOrPhone: email });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = await bcrypt.hash(password, 10);
  user.resetOTP = null;
  user.resetOTPExpiry = null;

  await user.save();

  res.json({ message: "Password reset successful" });
});

module.exports = router;
