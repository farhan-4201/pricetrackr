# Email Notification Setup Guide

This guide will help you set up Gmail to send email notifications for price drops and watchlist updates.

## Prerequisites

- A Gmail account
- Access to Google Account settings

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", click on **2-Step Verification**
4. Follow the prompts to enable 2FA (you'll need your phone)

### 2. Generate App Password

1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
2. You may need to sign in again
3. Under "Select app", choose **Mail**
4. Under "Select device", choose **Other (Custom name)**
5. Enter a name like "PriceTrackr" or "Price Tracker Backend"
6. Click **Generate**
7. Google will display a 16-character password (e.g., `abcd efgh ijkl mnop`)
8. **Copy this password** - you won't be able to see it again!

### 3. Update Backend .env File

1. Open `backend/.env` file
2. Find the email configuration section
3. Update the following values:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Important Notes:**
- Replace `your-actual-email@gmail.com` with your Gmail address
- Replace `abcdefghijklmnop` with the 16-character app password (remove spaces)
- Do NOT use your regular Gmail password - it won't work!

### 4. Restart the Server

After updating the .env file, restart your backend server:

```bash
cd backend
npm run dev
```

## Testing Email Notifications

### Test 1: Add Product to Watchlist

1. Sign in to the application
2. Search for a product
3. Add it to your watchlist
4. Check your email - you should receive a confirmation email

### Test 2: Enable Price Tracking

1. Go to your watchlist
2. Toggle "Track Price" on any product
3. Check your email - you should receive a tracking confirmation

### Test 3: Price Drop (Manual Test)

The cron job runs hourly. To test immediately:

```bash
cd backend
npm run price-monitor
```

This will check all tracked products and send emails if prices have dropped.

## Troubleshooting

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solution:** You're using your regular Gmail password instead of an App Password.
- Generate a new App Password following steps above
- Make sure to remove spaces from the 16-character password

### Error: "EAUTH authentication failed"

**Solution:** 
- Verify 2FA is enabled on your Google Account
- Generate a fresh App Password
- Double-check there are no typos in EMAIL_USER or EMAIL_PASS

### Emails Not Sending

**Check:**
1. Is the .env file in the correct location? (`backend/.env`)
2. Did you restart the server after updating .env?
3. Check server logs for email-related errors
4. Verify EMAIL_USER and EMAIL_PASS are not the default placeholder values

### Gmail Security Alert

If you receive a security alert from Google:
- This is normal when using App Passwords
- Click "Yes, it was me" to confirm
- The app will work normally after confirmation

## Email Notification Types

The application sends emails for:

1. **Watchlist Addition** - When a product is added to watchlist
2. **Price Tracking Enabled** - When price tracking is turned on
3. **Price Tracking Disabled** - When price tracking is turned off
4. **Price Drop Alert** - When a tracked product's price decreases
5. **Initial Tracking Confirmation** - First time a product price is checked

## Cron Job Schedule

The price monitoring cron job runs:
- **Schedule:** Every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
- **Cron Expression:** `0 * * * *`
- **What it does:** Checks all products with `isTracking: true` and sends emails if prices drop

## Customizing Email Content

To customize email templates, edit:
- `backend/routes/watchlist.js` - For watchlist-related emails
- `backend/price-monitor.js` - For price drop alerts

## Security Best Practices

✅ **DO:**
- Use App Passwords (never your regular password)
- Keep your .env file private (it's in .gitignore)
- Use different App Passwords for different applications
- Revoke App Passwords you're no longer using

❌ **DON'T:**
- Share your App Password
- Commit .env file to version control
- Use your regular Gmail password
- Disable 2FA after generating App Password

## Alternative Email Providers

While this guide focuses on Gmail, you can use other SMTP providers:

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Custom SMTP
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

## Support

If you continue to have issues:
1. Check the server console for detailed error messages
2. Verify all environment variables are set correctly
3. Test your SMTP credentials using an online SMTP tester
4. Review the `backend/utils/mailer.js` file for additional debugging

## Notes

- The application will work without email configuration
- Users will still receive in-app notifications
- Email is an optional enhancement for better user experience
- Consider using a dedicated email account for the application
