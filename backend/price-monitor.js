import cron from 'node-cron';
import mongoose from 'mongoose';
import WatchlistItem from './models/watchlist.js';
import Notification from './models/notification.js';
import User from './models/user.js';
import sendMail from './utils/mailer.js';
import darazScraper from './scrapers/daraz_api_scraper.js';
import priceoyeScraper from './scrapers/priceoye_api_scraper.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for price monitoring job');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to scrape individual product URLs
const scrapeProductPrice = async (marketplace, productUrl, productName) => {
  try {
    // For simplicity, we'll search by product name and take the best match
    // In a production system, you'd want more precise product matching
    let scraper;
    switch (marketplace) {
      case 'daraz':
        scraper = darazScraper;
        break;
      case 'priceoye':
        scraper = priceoyeScraper;
        break;
      default:
        console.log(`Scraper not available for marketplace: ${marketplace}`);
        return null;
    }

    if (!scraper) return null;

    // Extract query from product name (first few words)
    const queryWords = productName.split(' ').slice(0, 3).join(' ');
    const result = await scraper(queryWords);

    if (result.success && result.products.length > 0) {
      // Find the best matching product
      const bestMatch = result.products[0]; // They are sorted by relevance
      return bestMatch.price;
    }
  } catch (error) {
    console.error(`Error scraping ${marketplace} for ${productName}:`, error.message);
  }
  return null;
};

// Main price monitoring function
const monitorPrices = async () => {
  console.log('Starting price monitoring job...');

  try {
    // Get all watchlist items that are tracking prices
    const watchlistItems = await WatchlistItem.find({ isTracking: true });

    console.log(`Found ${watchlistItems.length} items to monitor`);

    for (const item of watchlistItems) {
      try {
        console.log(`Checking price for: ${item.name}`);

        // Get current price from the marketplace
        const currentPrice = await scrapeProductPrice(item.marketplace, item.url, item.name);

        if (!currentPrice) {
          console.log(`Could not get current price for ${item.name}`);
          continue;
        }

        const previousPrice = item.currentPrice;
        console.log(`${item.name}: Previous price: ${previousPrice}, Current price: ${currentPrice}`);

        if (previousPrice && currentPrice < previousPrice) {
          // Price has dropped!
          const priceDrop = previousPrice - currentPrice;
          const percentageDrop = Math.round((priceDrop / previousPrice) * 100);

          console.log(`Price drop detected for ${item.name}: -${priceDrop} (${percentageDrop}%)`);

          // Create in-app notification
          const notification = new Notification({
            userId: item.userId,
            type: 'price_drop',
            title: 'Price Drop Alert!',
            message: `${item.name} price dropped by Rs. ${priceDrop} (${percentageDrop}%). Now Rs. ${currentPrice}.`,
            productId: item.productId
          });

          await notification.save();

          // Send email notification
          try {
            const user = await User.findById(item.userId);
            if (user && user.emailAddress) {
              const emailSubject = `Price Drop Alert: ${item.name}`;
              const emailText = `
Dear ${user.fullName},

Great news! The price of "${item.name}" has dropped.

Previous Price: Rs. ${previousPrice}
New Price: Rs. ${currentPrice}
Price Drop: Rs. ${priceDrop} (${percentageDrop}%)

Check it out here: ${item.url}

Happy shopping!
PriceTrackr Team
              `;

              await sendMail(user.emailAddress, emailSubject, emailText);
              console.log(`Email sent to ${user.emailAddress} for ${item.name}`);
            }
          } catch (emailError) {
            console.error(`Failed to send email for ${item.name}:`, emailError.message);
            // Continue with in-app notification even if email fails
          }

          // Update the watchlist item with new price
          item.currentPrice = currentPrice;
          item.lastUpdated = new Date();
          await item.save();

        } else if (!previousPrice) {
          // First time checking price, just update it
          item.currentPrice = currentPrice;
          item.lastUpdated = new Date();
          await item.save();
        }

        // Wait a bit between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing item ${item.name}:`, error.message);
      }
    }

    console.log('Price monitoring job completed');

  } catch (error) {
    console.error('Error in price monitoring job:', error);
  }
};

// Export the monitoring function for manual testing if needed
export { monitorPrices };

// Run the job every hour (for testing, adjust as needed)
if (import.meta.url === `file://${process.argv[1]}`) {
  // Load environment variables
  import('dotenv').then(({ default: dotenv }) => {
    dotenv.config();
    connectDB();
    monitorPrices();

    // Schedule to run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      await monitorPrices();
    });

    console.log('Price monitoring cron job started. Will run every hour.');
  });
}
