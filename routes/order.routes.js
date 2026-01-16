const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

const router = express.Router();

/* ==========================
   EMAIL CONFIG
========================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ==========================
   BOOK → PDF MAP (CASE-INSENSITIVE, SAFE)
========================== */
const BOOK_PDF_MAP = {
  java: "Java-Programming-Simplified.pdf",
  "data structures": "Data-Structures & Algorithms.pdf",
  web: "Web-Programming-with-Html-Css-and-Javascript.pdf"
};

function getPdfForBook(bookName) {
  if (!bookName) return null;

  const name = bookName.toLowerCase();

  for (const key in BOOK_PDF_MAP) {
    if (name.includes(key)) {
      return BOOK_PDF_MAP[key];
    }
  }
  return null;
}

/* ==========================
   CREATE ORDER
========================== */
router.post("/create", async (req, res) => {
  try {
    const { userId, customerDetails, bookType } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const order = new Order({
      userId,
      customerDetails,
      items: cart.items,
      bookType,
      totalAmount: cart.totalAmount,
      orderStatus: "Pending",
      paymentStatus: "Pending",
      refundStatus: "Not Applicable"
    });

    await order.save();

    res.json({
      success: true,
      orderId: order._id
    });

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   GET LATEST PENDING ORDER
========================== */
router.get("/latest/:userId", async (req, res) => {
  const order = await Order.findOne({
    userId: req.params.userId,
    orderStatus: "Pending"
  }).sort({ createdAt: -1 });

  if (!order) {
    return res.status(404).json({ message: "No pending order found" });
  }

  res.json(order);
});

/* ==========================
   CONFIRM PAYMENT + EMAIL + DOWNLOAD LINKS
========================== */
router.post("/confirm-payment", async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Payment already completed" });
    }

    order.orderStatus = "Confirmed";
    order.paymentStatus = "Paid";
    await order.save();

    // Clear cart AFTER successful payment
    await Cart.deleteOne({ userId: order.userId });

    /* ===== GENERATE SECURE DOWNLOAD LINKS ===== */
    let downloadLinks = [];

    if (order.bookType === "Soft Copy") {
      order.items.forEach(item => {
        const pdfFile = getPdfForBook(item.name);
        if (pdfFile) {
          downloadLinks.push(
            `${process.env.BASE_URL}/secure-books/${encodeURIComponent(pdfFile)}`
          );
        }
      });
    }

    // 🔥 FAST RESPONSE (do not wait for email)
    res.json({ success: true });

    /* ===== SEND EMAIL AFTER RESPONSE ===== */
    const linksHtml = downloadLinks.length
      ? `<ul>${downloadLinks.map(l => `<li><a href="${l}">${l}</a></li>`).join("")}</ul>`
      : "";

    await transporter.sendMail({
      from: `BookVerse <${process.env.EMAIL_USER}>`,
      to: order.customerDetails.email,
      subject: "Order Confirmed - BookVerse",
      html: `
        <h3>Order Confirmed</h3>
        <p>Hello ${order.customerDetails.name},</p>

        <p>Your payment has been received successfully.</p>

        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
        <p><strong>Order Type:</strong> ${order.bookType}</p>

        ${
          downloadLinks.length
            ? `<p>Download your books below:</p>${linksHtml}`
            : `<p>Your books will be delivered soon.</p>`
        }

        <p>Thank you for shopping with BookVerse.</p>
      `
    });

  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   CANCEL ORDER + EMAIL
========================== */
router.post("/cancel", async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus !== "Confirmed") {
      return res.status(400).json({
        message: "Only confirmed orders can be cancelled"
      });
    }

    order.orderStatus = "Cancelled";
    order.refundStatus = "Initiated";
    await order.save();

    await transporter.sendMail({
      from: `BookVerse <${process.env.EMAIL_USER}>`,
      to: order.customerDetails.email,
      subject: "Order Cancelled & Refund Initiated - BookVerse",
      html: `
        <h3>Order Cancelled</h3>
        <p>Hello ${order.customerDetails.name},</p>

        <p>Your order has been cancelled successfully.</p>

        <p><strong>Refund Status:</strong> Initiated</p>
        <p><strong>Amount:</strong> ₹${order.totalAmount}</p>

        <p>Refund will be processed shortly.</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
