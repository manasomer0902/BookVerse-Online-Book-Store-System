const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true // allows login via phone only
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^\d{10}$/, "Phone number must be 10 digits"]
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
