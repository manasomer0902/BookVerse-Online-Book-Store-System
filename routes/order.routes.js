const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

const router = express.Router();

/* ================= EMAIL CONFIG ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= BOOK → PDF MAP (MATCHES FOLDER) ================= */
const BOOK_PDF_MAP = {
  "java": "Java-Programming-Simplified.pdf",
  "data structures": "Data-Structures & Algorithms.pdf",
  "dbms": "DBMS Concepts.pdf",
  "python": "Python Crash Course.pdf",
  "clean": "Clean Code.pdf",
  "network": "Computer Networks.pdf",
  "operating": "Operating Systems.pdf",
  "web": "Web Programming with Html Css and Javascript.pdf",
  "c programming": "C Programming Language.pdf",
  "Pro java": "Pro Java Programming"
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

/* ================= CREATE ORDER ================= */
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
      orderStatus: "Confirmed",
      paymentStatus: "Pending",
      refundStatus: "Not Applicable"
    });

    await order.save();
    res.json({ success: true, orderId: order._id });

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LATEST PENDING ORDER ================= */
router.get("/latest/:userId", async (req, res) => {
  const order = await Order.findOne({
    userId: req.params.userId,
    orderStatus: "Confirmed"
  }).sort({ createdAt: -1 });

  if (!order) {
    return res.status(404).json({ message: "No pending order found" });
  }

  res.json(order);
});

/* ================= CONFIRM PAYMENT ================= */
router.post("/confirm-payment", async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Payment already completed" });
    }

    // ✅ Update order
    order.orderStatus = "Confirmed";
    order.paymentStatus = "Paid";
    await order.save();

    // ✅ Clear cart
    await Cart.deleteOne({ userId: order.userId });

    // ⚡ FAST RESPONSE (UI does not wait for email)
    res.json({ success: true });

    /* ================= EMAIL WITH ALL PDFs ================= */
    let attachments = [];

    if (order.bookType === "Soft Copy") {
      order.items.forEach(item => {
        const pdfFile = getPdfForBook(item.name);

        if (pdfFile) {
          attachments.push({
            filename: pdfFile,
            path: path.join(__dirname, "../public/books", pdfFile)
          });
        }
      });
    }

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
          order.bookType === "Soft Copy"
            ? "<p>Your purchased books are attached as PDF files.</p>"
            : "<p>Your books will be delivered soon.</p>"
        }

        <p>Thank you for shopping with BookVerse.</p>
      `,
      attachments
    });

  } catch (err) {
    console.error("CONFIRM PAYMENT ERROR:", err);
  }
});

/* ================= MY ORDERS ================= */
router.get("/my-orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: "Failed to load orders" });
  }
});

/* ================= CANCEL ORDER (FIXED REFUND LOGIC) ================= */
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

    // ✅ Soft copy → No refund
    if (order.bookType === "Soft Copy") {
      order.refundStatus = "Not Applicable";
    } else {
      order.refundStatus = "Initiated";
    }

    await order.save();

    const refundText =
      order.bookType === "Soft Copy"
        ? "Refund is not applicable for soft copy orders."
        : "Your refund has been initiated and will be processed shortly.";

    await transporter.sendMail({
      from: `BookVerse <${process.env.EMAIL_USER}>`,
      to: order.customerDetails.email,
      subject: "Order Cancelled - BookVerse",
      html: `
        <h3>Order Cancelled</h3>
        <p>Hello ${order.customerDetails.name},</p>

        <p>Your order has been cancelled successfully.</p>
        <p><strong>${refundText}</strong></p>
        <p><strong>Amount:</strong> ₹${order.totalAmount}</p>

        <p>Regards,<br>BookVerse Team</p>
      `
    });

    res.json({
      success: true,
      message: "Order cancelled successfully"
    });

  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
