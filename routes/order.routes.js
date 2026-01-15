const express = require("express");
const nodemailer = require("nodemailer");
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
   CREATE ORDER (FROM CART)
   POST /api/order/create
========================== */
router.post("/create", async (req, res) => {
  try {
    const { userId, customerDetails, bookType } = req.body;

    if (!userId || !customerDetails || !bookType) {
      return res.status(400).json({ message: "Missing order details" });
    }

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

    // ❗ DO NOT DELETE CART HERE (wait for payment success)

    res.json({
      success: true,
      message: "Order created",
      orderId: order._id
    });

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   GET LATEST ORDER (PAYMENT)
   GET /api/order/latest/:userId
========================== */
router.get("/latest/:userId", async (req, res) => {
  try {
    const order = await Order.findOne({
      userId: req.params.userId,
      orderStatus: "Pending"
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ message: "No pending order found" });
    }

    res.json(order);

  } catch (err) {
    console.error("FETCH LATEST ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   CONFIRM PAYMENT + EMAIL
   POST /api/order/confirm-payment
========================== */
router.post("/confirm-payment", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Payment already completed" });
    }

    // ✅ Update order
    order.orderStatus = "Confirmed";
    order.paymentStatus = "Paid";
    await order.save();

    // ✅ Clear cart AFTER payment success
    await Cart.deleteOne({ userId: order.userId });

    // ✅ Send email
    await transporter.sendMail({
      from: `BookVerse <${process.env.EMAIL_USER}>`,
      to: order.customerDetails.email,
      subject: "Order Confirmed - BookVerse",
      html: `
        <h3>Order Confirmed</h3>
        <p>Hello ${order.customerDetails.name},</p>
        <p>Your order has been successfully confirmed.</p>
        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
        <p>Thank you for shopping with BookVerse.</p>
      `
    });

    // 📱 DEMO SMS
    console.log(
      `SMS to ${order.customerDetails.phone}: Order confirmed. Amount ₹${order.totalAmount}`
    );

    res.json({ success: true, message: "Payment confirmed" });

  } catch (err) {
    console.error("CONFIRM PAYMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   MY ORDERS
   GET /api/order/my-orders/:userId
========================== */
router.get("/my-orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    console.error("FETCH ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

/* ==========================
   CANCEL ORDER (DEMO REFUND)
   POST /api/order/cancel
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

    res.json({
      success: true,
      message: "Order cancelled. Refund initiated (Demo)."
    });

  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
