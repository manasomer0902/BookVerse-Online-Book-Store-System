const express = require("express");
const nodemailer = require("nodemailer");
const Contact = require("../models/Contact");

const router = express.Router();

/* ================= EMAIL CONFIG ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= CONTACT FORM ================= */
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, bookName, message } = req.body;

    // ✅ Save to MongoDB
    await Contact.create({
      name,
      email,
      phone,
      bookName,
      message
    });

    // ✅ Send email to YOU
    await transporter.sendMail({
      from: `BookVerse Contact <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "New Contact Message - BookVerse",
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Book:</strong> ${bookName || "Not specified"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;
