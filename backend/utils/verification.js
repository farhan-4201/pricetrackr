import crypto from 'crypto';

// Generate secure verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Set verification token expiry (24 hours from now)
export const getVerificationTokenExpiry = () => {
  const now = new Date();
  now.setHours(now.getHours() + 24); // Add 24 hours
  return now;
};

// Create verification email HTML template
export const createVerificationEmailTemplate = (fullName, verificationUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - PriceTrackr</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
          color: #334155;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #22c55e, #a855f7);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #22c55e, #a855f7);
          color: white !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          text-align: center;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }
        .button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(34, 197, 94, 0.5);
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          background-color: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        .code {
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 20px;
          font-family: monospace;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          word-break: break-all;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding-left: 20px;
            padding-right: 20px;
          }
          .button {
            display: block;
            width: 100%;
            box-sizing: border-box;
            text-align: center;
            margin: 20px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to PriceTrackr!</h1>
        </div>

        <div class="content">
          <h2>Hi ${fullName},</h2>

          <p>Thank you for signing up for PriceTrackr! We're excited to help you track and compare prices across multiple marketplaces.</p>

          <p>To complete your registration and start saving money, please verify your email address by clicking the button below:</p>

          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify My Email Address</a>
          </div>

          <p><strong>This verification link will expire in 24 hours.</strong></p>

          <div class="warning">
            <strong>Important:</strong> If you didn't create this account, please ignore this email. The link will expire and your account will remain inactive.
          </div>

          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>

          <div class="code">
            ${verificationUrl}
          </div>

          <p>Welcome to the PriceTrackr community!</p>

          <p>Best regards,<br>The PriceTrackr Team</p>
        </div>

        <div class="footer">
          <p>This email was sent to you because you registered for a PriceTrackr account.</p>
          <p>&copy; 2025 PriceTrackr. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `.trim();
};

// Create resend verification email template
export const createResendVerificationEmailTemplate = (fullName, verificationUrl, attemptsLeft) => {
  const isLastAttempt = attemptsLeft <= 1;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Reminder - PriceTrackr</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
          color: #334155;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          padding: 16px 32px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          text-align: center;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }
        .button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.5);
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .urgent {
          background-color: #fee2e2;
          border: 1px solid #dc2626;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          background-color: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        .code {
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 20px;
          font-family: monospace;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          word-break: break-all;
        }
        @media (max-width: 600px) {
          .container {
            margin: 10px;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding-left: 20px;
            padding-right: 20px;
          }
          .button {
            display: block;
            width: 100%;
            box-sizing: border-box;
            text-align: center;
            margin: 20px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>

        <div class="content">
          <h2>Hi ${fullName},</h2>

          <p>We noticed you haven't verified your PriceTrackr account yet. Don't miss out on tracking and comparing prices to save money!</p>

          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify My Email Address</a>
          </div>

          ${isLastAttempt ?
            `<div class="urgent">
              <strong>⚠️ This is your last chance!</strong> This verification link will expire soon, and you'll need to create a new account if you don't verify it.
            </div>`
          : `<div class="warning">
              <strong>Reminder:</strong> You have <strong>${attemptsLeft}</strong> attempts remaining to verify your account. After that, you'll need to create a new account.
            </div>`
          }

          <p>If you can't find the original verification email or the link has expired, use the button above for a fresh verification link that will be valid for another 24 hours.</p>

          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>

          <div class="code">
            ${verificationUrl}
          </div>

          <p>Looking forward to seeing you in the PriceTrackr app!</p>

          <p>Best regards,<br>The PriceTrackr Team</p>
        </div>

        <div class="footer">
          <p>This is a reminder email. You received this because you have an unverified PriceTrackr account.</p>
          <p>&copy; 2025 PriceTrackr. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `.trim();
};
