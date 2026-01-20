const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  emailOrPhone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["student", "seller", "admin"],
    default: "student"
  },

  // Forgot Password
  resetOTP: String,
  resetOTPExpiry: Date
});

module.exports = mongoose.model("User", userSchema);
