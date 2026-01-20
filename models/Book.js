const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },     // later
  pdf: { type: String },       // later
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",   // seller
    required: true
  }
});

module.exports = 
  mongoose.models.Book || mongoose.model("Book", bookSchema);
