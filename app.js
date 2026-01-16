require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

// ===== ROUTES =====
const authRoutes = require("./routes/auth.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

// ===== APP INIT =====
const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, "public")));
app.use("/secure-books", express.static(path.join(__dirname, "public/books")));

// ===== API ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);

// ===== PAGE ROUTES =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views/about.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "views/signup.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views/login.html"));
});

app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "views/forgot-password.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "views/contact.html"));
});

app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "views/privacy.html"));
});

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "views/terms.html"));
});

app.get("/refund", (req, res) => {
  res.sendFile(path.join(__dirname, "views/refund.html"));
});

app.get("/books", (req, res) => {
  res.sendFile(path.join(__dirname, "views/books.html"));
});

app.get("/cart", (req, res) => {
  res.sendFile(path.join(__dirname, "views/cart.html"));
});

app.get("/order", (req, res) => {
  res.sendFile(path.join(__dirname, "views/order.html"));
});

app.get("/payment", (req, res) => {
  res.sendFile(path.join(__dirname, "views/payment.html"));
});

app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "views/success.html"));
});

app.get("/my-orders", (req, res) => {
  res.sendFile(path.join(__dirname, "views/my-orders.html"));
});

app.get("/cancel-order", (req, res) => {
  res.sendFile(path.join(__dirname, "views/cancel-order.html"));
});

app.get("/reviews", (req, res) => {
  res.sendFile(path.join(__dirname, "views/reviews.html"));
});

app.get("/seller", (req, res) => {
  res.sendFile(path.join(__dirname, "views/seller.html"));
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

// ===== SERVER START =====
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// ===== MONGODB =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));
