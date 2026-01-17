const express = require("express");
const nodemailer = require("nodemailer");
const Review = require("../models/Review");

const router = express.Router();

/* ================= EMAIL ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= ADD REVIEW ================= */
router.post("/", async (req, res) => {
  try {
    const { name, bookName, review } = req.body;

    if (!name || !review) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // ✅ Save to MongoDB
    const newReview = new Review({
      name,
      bookName,
      review
    });

    await newReview.save();

    // ✅ Send email to YOU (admin)
    await transporter.sendMail({
      from: `BookVerse <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "📝 New Student Review - BookVerse",
      html: `
        <h3>New Review Submitted</h3>
        <p><strong>Name:</strong> ${name}</p>
        ${bookName ? `<p><strong>Book:</strong> ${bookName}</p>` : ""}
        <p><strong>Review:</strong></p>
        <p>${review}</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("REVIEW ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET REVIEWS ================= */
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch {
    res.status(500).json({ message: "Failed to load reviews" });
  }
});

module.exports = router;
