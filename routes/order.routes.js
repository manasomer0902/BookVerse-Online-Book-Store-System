const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

/**
 * ADD TO CART / CREATE ORDER
 * POST /api/order/add
 */
router.post("/add", async (req, res) => {
  try {
    const { userId, items } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid cart data" });
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = new Order({
      userId,
      items,
      totalAmount
    });

    await order.save();

    res.status(201).json({
      message: "Cart saved successfully",
      orderId: order._id
    });

  } catch (error) {
    console.error("ORDER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

/**
 * GET USER CART / LATEST ORDER
 * GET /api/order/cart/:userId
 */
router.get("/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const order = await Order.findOne({ userId }).sort({ createdAt: -1 });

    if (!order) {
      return res.json({ items: [], totalAmount: 0 });
    }

    res.json(order);

  } catch (error) {
    console.error("FETCH CART ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});
