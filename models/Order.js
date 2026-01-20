const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    customerDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true }
    },

    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String }
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    },

    bookType: {
      type: String,
      enum: ["Soft Copy", "Hard Copy"],
      required: true
    },

    orderStatus: {
      type: String,
      enum: ["Pending","Confirmed", "Dispatched", "On The Way", "Delivered", "Cancelled"],
      default: "Pending"
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending"
    },

    refundStatus: {
      type: String,
      enum: ["Not Applicable", "Initiated", "Completed"],
      default: "Not Applicable"
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
