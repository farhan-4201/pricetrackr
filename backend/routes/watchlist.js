import express from "express";
import { authenticate as auth } from "../middleware/auth.js";
import WatchlistItem from "../models/watchlist.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";
import sendMail from "../utils/mailer.js";

const router = express.Router();

// Get all watchlist items for current user
router.get("/", auth, async (req, res) => {
  try {
    const watchlist = await WatchlistItem.find({ userId: req.user.userId })
      .sort({ addedAt: -1 });
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

// Add item to watchlist
router.post("/", auth, async (req, res) => {
  try {
    console.log('Request body for watchlist add:', req.body);
    console.log('User from JWT:', req.user);

    // Validate required fields
    const { productId, name, marketplace, url } = req.body;
    if (!productId || !name || !marketplace || !url) {
      console.error('Missing required fields:', { productId, name, marketplace, url });
      return res.status(400).json({ error: "Missing required fields: productId, name, marketplace, url" });
    }

    const watchlistItem = new WatchlistItem({
      userId: req.user.userId,
      productId: req.body.productId,
      name: req.body.name,
      image: req.body.image,
      marketplace: req.body.marketplace,
      category: req.body.category,
      currentPrice: req.body.currentPrice,
      url: req.body.url,
      isTracking: req.body.isTracking !== undefined ? req.body.isTracking : false, // Default to false if not specified
      addedAt: new Date(),
      lastUpdated: new Date()
    });

    console.log('Saving watchlist item:', watchlistItem);
    await watchlistItem.save();
    console.log('Watchlist item saved successfully');

    // Create watchlist notification
    try {
      // Fetch the user from database to ensure they exist and get proper ObjectId
      const user = await User.findById(req.user.userId);
      if (!user) {
        console.error('User not found in database:', req.user.userId);
      } else {
        const notification = new Notification({
          userId: user._id, // Using the actual ObjectId from database
          type: 'watchlist',
          title: 'Product Added to Watchlist',
          message: `"${req.body.name}" has been added to your watchlist for price monitoring.`,
          productIdentifier: req.body.productId // Using the string identifier
        });
        await notification.save();
        console.log('Watchlist notification created successfully');
      }
    } catch (notificationError) {
      console.error('Error creating watchlist notification:', notificationError.message);
      // Don't fail the request if notification creation fails
    }

    // Send email notification
    try {
      const user = await User.findById(req.user.userId);
      if (user && user.emailAddress) {
        const trackingStatus = watchlistItem.isTracking ? 'enabled' : 'disabled';
        const emailSubject = `Product Added to Watchlist: ${req.body.name}`;
        const emailText = `
Dear ${user.fullName},

You have successfully added "${req.body.name}" to your watchlist.

Product Details:
- Name: ${req.body.name}
- Marketplace: ${req.body.marketplace}
- Current Price: Rs. ${req.body.currentPrice || 'Not available'}
- Product URL: ${req.body.url}

${watchlistItem.isTracking ?
  `🎯 Price tracking is enabled! You will receive email notifications when the price drops.

⏰ Monitoring Schedule:
We will monitor this product hourly and notify you of any price changes.` :

  `💡 Tip: You can enable price tracking anytime from your watchlist to receive email notifications when prices drop.`
}

You can view and manage your watchlist on the PriceTrackr dashboard.

Happy shopping!
PriceTrackr Team
        `;

        await sendMail(user.emailAddress, emailSubject, emailText);
        console.log(`Watchlist email sent to ${user.emailAddress} for ${req.body.name}`);
      }
    } catch (emailError) {
      console.error(`Failed to send watchlist email for ${req.body.name}:`, emailError.message);
      // Don't fail the request if email sending fails
    }

    res.json(watchlistItem);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    if (error.code === 11000) {
      // Duplicate key error - item already in watchlist
      res.status(409).json({ error: "Item already in watchlist" });
    } else {
      res.status(400).json({ error: `Validation error: ${error.message}` });
    }
  }
});

// ✅ SPECIFIC ROUTES (must come before generic /:id routes)

// Check if item is in watchlist
router.get("/check/:productId", auth, async (req, res) => {
  try {
    const item = await WatchlistItem.findOne({
      productId: req.params.productId,
      userId: req.user.userId
    });

    res.json({ inWatchlist: !!item, item: item });
  } catch (error) {
    res.status(500).json({ error: "Failed to check watchlist status" });
  }
});

// Get watchlist statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const stats = await WatchlistItem.aggregate([
      { $match: { userId: req.user.userId } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          trackedItems: { $sum: { $cond: ["$isTracking", 1, 0] } },
          byMarketplace: { $push: "$marketplace" }
        }
      }
    ]);

    const result = stats[0] || { totalItems: 0, trackedItems: 0 };
    result.byMarketplace = result.byMarketplace ?
      result.byMarketplace.reduce((acc, marketplace) => {
        acc[marketplace] = (acc[marketplace] || 0) + 1;
        return acc;
      }, {}) : {};

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch watchlist statistics" });
  }
});

// ✅ GENERIC /:id ROUTES (must come LAST)

// Update watchlist item
router.put("/:id", auth, async (req, res) => {
  try {
    const updatedItem = await WatchlistItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: "Watchlist item not found" });
    }

    // Send email notification if tracking status changed
    if (req.body.isTracking !== undefined) {
      try {
        const user = await User.findById(req.user.userId);
        if (user && user.emailAddress) {
          const trackingStatus = req.body.isTracking ? 'enabled' : 'disabled';
          const emailSubject = `Price Tracking ${trackingStatus.charAt(0).toUpperCase() + trackingStatus.slice(1)}: ${updatedItem.name}`;
          const emailText = `
Dear ${user.fullName},

Price tracking has been ${trackingStatus} for "${updatedItem.name}".

${req.body.isTracking ?
  `🎉 Great news! You will now receive email notifications when the price drops on this product.

📋 Product Details:
- Name: ${updatedItem.name}
- Marketplace: ${updatedItem.marketplace}
- Current Price: Rs. ${updatedItem.currentPrice || 'Not available'}
- Product URL: ${updatedItem.url}

⏰ Monitoring Schedule:
We will monitor this product hourly and notify you immediately of any price changes.

💡 Tip: You can manage your tracked products anytime from your watchlist dashboard.` :

  `Price tracking has been disabled for this product.

You will no longer receive email notifications for price changes on "${updatedItem.name}".

You can re-enable tracking anytime from your watchlist.`
}

Best regards,
PriceTrackr Team
          `;

          await sendMail(user.emailAddress, emailSubject, emailText);
          console.log(`Tracking status email sent to ${user.emailAddress} for ${updatedItem.name}`);
        }
      } catch (emailError) {
        console.error(`Failed to send tracking status email for ${updatedItem.name}:`, emailError.message);
        // Don't fail the request if email sending fails
      }
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove item from watchlist
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedItem = await WatchlistItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!deletedItem) {
      return res.status(404).json({ error: "Watchlist item not found" });
    }

    res.json({ message: "Item removed from watchlist" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove item from watchlist" });
  }
});

export default router;
