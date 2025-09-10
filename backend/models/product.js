const mongoose = require("mongoose");

const PriceHistorySchema = new mongoose.Schema({
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const AlertSchema = new mongoose.Schema({
  type: { type: String, enum: ['target_price', 'percentage_drop'], required: true },
  value: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  triggeredAt: { type: Date }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  sku: { type: String },
  currentPrice: { type: Number, required: true },
  targetPrice: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  lastChecked: { type: Date, default: Date.now },

  // Additional fields for enhanced tracking
  priceHistory: [PriceHistorySchema],
  alerts: [AlertSchema],
  vendor: { type: String, enum: ['amazon', 'ebay', 'aliexpress', 'walmart', 'bestbuy', 'daraz'], required: true },
  imageUrl: { type: String },
  category: { type: String },

  // Statistics
  priceChange24h: { type: Number, default: 0 },
  priceChangeWeek: { type: Number, default: 0 },
  lowestPrice: { type: Number, default: 0 },
  highestPrice: { type: Number, default: 0 },

  // User preferences
  isActive: { type: Boolean, default: true },
  notes: { type: String }
});

// Index for performance
ProductSchema.index({ userId: 1 });
ProductSchema.index({ vendor: 1 });
ProductSchema.index({ category: 1 });

module.exports = mongoose.model("Product", ProductSchema);
