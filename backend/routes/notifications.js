import express from "express";
import Notification from "../models/notification.js";
import { authenticate as auth } from "../middleware/auth.js";

const router = express.Router();

// Get notification count (must be before /:id routes)
router.get("/count", auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });
    res.json({ unreadCount });
  } catch (error) {
    console.error("Notification count error:", error);
    res.status(500).json({ error: "Failed to get notification count" });
  }
});

// Get all notifications for current user
router.get("/", auth, async (req, res) => {
  try {
    const { isRead, limit = 50 } = req.query;
    let filter = { userId: req.user._id };

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .populate('productId', 'name currentPrice')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// Mark all notifications as read
router.put("/mark-all-read", auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: `${result.modifiedCount} notifications marked as read` });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// Delete notification
router.delete("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Create notification (internal use)
router.post("/", auth, async (req, res) => {
  try {
    const notification = new Notification({
      ...req.body,
      userId: req.user._id
    });
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
