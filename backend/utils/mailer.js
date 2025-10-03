import nodemailer from "nodemailer";

const sendMail = async (to, subject, text) => {
  try {
    // Check if email configuration is set up
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
        process.env.EMAIL_USER === 'your-email@gmail.com' ||
        process.env.EMAIL_PASS === 'your-app-password') {
      console.warn("📧 Email configuration not set up. Skipping email send.");
      console.warn("💡 To enable email notifications:");
      console.warn("   1. Enable 2FA on your Gmail account");
      console.warn("   2. Generate App Password: https://myaccount.google.com/apppasswords");
      console.warn("   3. Update .env file with your email and app password");
      console.warn("   4. Restart the server");
      console.warn("🔄 Note: App will work without emails - users will still get in-app notifications");
      return null;
    }

    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"PriceTrackr" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: text.replace(/\n/g, '<br>') // Simple HTML conversion
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Mail sent successfully to:", to);
    console.log("📧 Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);

    // Provide helpful setup instructions
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error("\n🔧 GMAIL SETUP INSTRUCTIONS:");
      console.error("1. Enable 2-Factor Authentication on your Gmail account");
      console.error("2. Generate an App Password: https://myaccount.google.com/apppasswords");
      console.error("3. Update your .env file:");
      console.error("   EMAIL_USER=your-email@gmail.com");
      console.error("   EMAIL_PASS=your-16-character-app-password");
      console.error("4. Restart the server");
    }

    throw error;
  }
};

export default sendMail;
