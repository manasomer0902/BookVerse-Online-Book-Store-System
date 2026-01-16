const express = require("express");
const Cart = require("../models/Cart");

const router = express.Router();

/* ==========================
   ADD TO CART
   POST /api/cart/add-to-cart
========================== */
router.post("/add-to-cart", async (req, res) => {
  try {
    const { userId, name, price, image } = req.body;

    if (!userId || !name || !price) {
      return res.status(400).json({ message: "Missing cart data" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        totalAmount: 0
      });
    }

    const item = cart.items.find(i => i.name === name);

    if (item) {
      item.quantity += 1;
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

    res.json({ success: true });

  } catch (err) {
    console.error("ADD TO CART ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   GET CART (FOR CART PAGE)
   GET /api/cart/:userId
========================== */
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      return res.json({ items: [], totalAmount: 0 });
    }
    res.json(cart);
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   GET CART (FOR HOME BADGE)
   GET /api/cart/cart/:userId
========================== */
router.get("/cart/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      return res.json({ items: [], totalAmount: 0 });
    }
    res.json(cart);
  } catch (err) {
    console.error("GET CART COUNT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================
   INCREASE QUANTITY
   POST /api/cart/increase
========================== */
router.post("/increase", async (req, res) => {
  const { userId, name } = req.body;

  const cart = await Cart.findOne({ userId });
  if (!cart) return res.json({ success: true });

  const item = cart.items.find(i => i.name === name);
  if (item) {
    item.quantity += 1;
    cart.totalAmount += item.price;
    await cart.save();
  }

  res.json({ success: true });
});

/* ==========================
   DECREASE QUANTITY
   POST /api/cart/decrease
========================== */
router.post("/decrease", async (req, res) => {
  const { userId, name } = req.body;

  const cart = await Cart.findOne({ userId });
  if (!cart) return res.json({ success: true });

  const item = cart.items.find(i => i.name === name);
  if (item) {
    item.quantity -= 1;
    cart.totalAmount -= item.price;

    if (item.quantity <= 0) {
      cart.items = cart.items.filter(i => i.name !== name);
    }

    if (cart.totalAmount < 0) cart.totalAmount = 0;
    await cart.save();
  }

  res.json({ success: true });
});

/* ==========================
   REMOVE ITEM COMPLETELY
   POST /api/cart/remove-item
========================== */
router.post("/remove-item", async (req, res) => {
  const { userId, name } = req.body;

  const cart = await Cart.findOne({ userId });
  if (!cart) return res.json({ success: true });

  const item = cart.items.find(i => i.name === name);
  if (!item) return res.json({ success: true });

  cart.totalAmount -= item.price * item.quantity;
  cart.items = cart.items.filter(i => i.name !== name);

  if (cart.totalAmount < 0) cart.totalAmount = 0;
  await cart.save();

  res.json({ success: true });
});

module.exports = router;
