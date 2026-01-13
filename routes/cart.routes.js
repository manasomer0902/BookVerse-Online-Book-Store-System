const express = require("express");
const Cart = require("../models/Cart");

const router = express.Router();

/**
 * ADD TO CART
 * POST /api/cart/add-to-cart
 */
router.post("/add-to-cart", async (req, res) => {
  try {
    const { userId, name, price, image } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        totalAmount: 0
      });
    }

    const existingItem = cart.items.find(item => item.name === name);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        name,
        price,
        quantity: 1,
        image
      });
    }

    cart.totalAmount += price;

    await cart.save();

    res.json({ message: "Item added to cart" });
  } catch (err) {
    console.error("ADD TO CART ERROR:", err);
    res.status(500).json({ message: "Failed to add to cart" });
  }
});

/**
 * GET CART BY USER
 * GET /api/cart/cart/:userId
 */
router.get("/cart/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });

    if (!cart) {
      return res.json({ items: [], totalAmount: 0 });
    }

    res.json(cart);
  } catch (err) {
    console.error("LOAD CART ERROR:", err);
    res.status(500).json({ message: "Failed to load cart" });
  }
});

module.exports = router;
