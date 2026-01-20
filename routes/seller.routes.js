const express = require("express");
const Book = require("../models/Book");

const router = express.Router();

/* =========================
   ADD BOOK
========================= */
router.post("/add", async (req, res) => {
  try {
    const { title, author, price, quantity, sellerId } = req.body;

    if (!title || !author || !price || !quantity || !sellerId) {
      return res.status(400).json({ message: "All fields required" });
    }

    const book = new Book({
      title,
      author,
      price,
      quantity,
      createdBy: sellerId
    });

    await book.save();
    res.json({ success: true });

  } catch (err) {
    console.error("ADD BOOK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET SELLER BOOKS  ✅ FIXED
========================= */
router.get("/:sellerId", async (req, res) => {
  try {
    const books = await Book.find({ createdBy: req.params.sellerId });
    res.json(books); // MUST return JSON
  } catch (err) {
    console.error("GET BOOKS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   DELETE BOOK
========================= */
router.delete("/:id", async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
