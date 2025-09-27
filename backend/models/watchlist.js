import mongoose from "mongoose";

const WatchlistItemSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Use String to match JWT token structure
  productId: { type: String, required: true }, // Unique identifier for the product across marketplaces
  name: { type: String, required: true },
  image: { type: String },
  marketplace: { type: String, enum: ['daraz', 'priceoye', 'amazon', 'ebay', 'aliexpress'], required: true },
  category: { type: String },
  currentPrice: { type: Number },
  url: { type: String, required: true },

  // Optional tracking data if user enables price tracking for this item
  isTracking: { type: Boolean, default: false },

  // Metadata
  addedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  notes: { type: String } // User notes about the item
});

// Compound index to ensure unique product per user
WatchlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

const WatchlistItem = mongoose.model("WatchlistItem", WatchlistItemSchema);

export default WatchlistItem;
