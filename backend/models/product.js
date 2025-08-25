const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  targetPrice: { type: Number },
  userEmail: { type: String, required: true },
  lastChecked: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", ProductSchema);
