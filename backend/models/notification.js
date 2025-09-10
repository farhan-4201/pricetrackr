const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['price_alert', 'price_drop', 'account', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index for performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
