const express = require("express");
const Order = require("../models/Order");
const nodemailer = require("nodemailer");

const router = express.Router();

/* ================= EMAIL SETUP ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= EMAIL TEMPLATE ================= */
function getEmailContent(status, name, orderId) {
  const messages = {
    "Confirmed": "Your order has been confirmed successfully.",
    "Dispatched": "Your order has been dispatched.",
    "On The Way": "Your order is on the way 🚚",
    "Delivered": "Your order has been delivered 🎉"
  };

  return `
    <h3>Order Update - BookVerse</h3>
    <p>Hello ${name},</p>
    <p>${messages[status]}</p>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p>Thank you for shopping with BookVerse.</p>
  `;
}

/* =========================
   GET ALL ORDERS (ADMIN)
========================= */
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   UPDATE ORDER STATUS + EMAIL
========================= */
router.put("/order-status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    console.log("ADMIN STATUS UPDATE:", status);

    if (!status) {
      return res.status(400).json({ message: "Status missing" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = status;
    console.log("Saving status:", status);
    await order.save();

    // 📧 SEND EMAIL
    if (order.customerDetails?.email) {
      await transporter.sendMail({
        from: `BookVerse <${process.env.EMAIL_USER}>`,
        to: order.customerDetails.email,
        subject: `Order ${status} - BookVerse`,
        html: getEmailContent(
          status,
          order.customerDetails.name || "Customer",
          order._id
        )
      });
    }

    res.json({
      success: true,
      message: "Order updated & email sent"
    });

  } catch (err) {
    console.error("ADMIN STATUS ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
