import 'dotenv/config';
import sendMail from './utils/mailer.js';

/**
 * Test Email Functionality
 * 
 * This script tests if your email configuration is working correctly.
 * Run: node test-email.js
 */

const testEmail = async () => {
  console.log('🧪 Testing Email Configuration...\n');
  
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email not configured!');
    console.error('Please update EMAIL_USER and EMAIL_PASS in .env file');
    console.error('See EMAIL_SETUP.md for instructions\n');
    process.exit(1);
  }

  if (process.env.EMAIL_USER === 'your-email@gmail.com' || 
      process.env.EMAIL_PASS === 'your-app-password') {
    console.error('❌ Email still has default values!');
    console.error('Please update EMAIL_USER and EMAIL_PASS in .env file');
    console.error('See EMAIL_SETUP.md for instructions\n');
    process.exit(1);
  }

  console.log('📧 Email Configuration:');
  console.log(`   Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);
  console.log(`   Port: ${process.env.EMAIL_PORT || 587}`);
  console.log(`   User: ${process.env.EMAIL_USER}`);
  console.log(`   Pass: ${'*'.repeat(16)} (hidden)\n`);

  console.log('📤 Sending test email...\n');

  const testSubject = '🎉 PriceTrackr Email Test - Success!';
  const testMessage = `
Hello!

This is a test email from PriceTrackr to verify your email configuration is working correctly.

✅ Email Configuration: SUCCESS
✅ SMTP Connection: SUCCESS
✅ Email Delivery: SUCCESS

Your email notifications are now fully functional! You will receive:
- Watchlist addition confirmations
- Price tracking status updates
- Price drop alerts

Test Details:
- Sent at: ${new Date().toLocaleString()}
- From: PriceTrackr Backend
- Configuration: Gmail SMTP

If you received this email, your setup is complete! 🎊

Best regards,
PriceTrackr Team
  `;

  try {
    const result = await sendMail(
      process.env.EMAIL_USER, // Send to yourself
      testSubject,
      testMessage
    );

    if (result) {
      console.log('✅ SUCCESS! Test email sent successfully!\n');
      console.log('📬 Check your inbox:', process.env.EMAIL_USER);
      console.log('📧 Subject:', testSubject);
      console.log('🆔 Message ID:', result.messageId);
      console.log('\n🎉 Email configuration is working correctly!');
      console.log('💡 You can now start the server and receive notifications.\n');
    } else {
      console.log('⚠️  Email sent but no confirmation received');
      console.log('This might be normal - check your inbox to confirm.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ FAILED! Could not send test email\n');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('   • Authentication failed - check your App Password');
      console.error('   • Make sure you\'re using an App Password, not your regular Gmail password');
      console.error('   • Verify 2FA is enabled on your Google Account');
      console.error('   • Generate a new App Password: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('   • Connection failed - check your internet connection');
      console.error('   • Verify EMAIL_HOST and EMAIL_PORT are correct');
      console.error('   • Check if your firewall is blocking port 587');
    } else {
      console.error('   • Double-check all values in .env file');
      console.error('   • Make sure there are no extra spaces in EMAIL_USER or EMAIL_PASS');
      console.error('   • Verify the App Password is 16 characters (no spaces)');
    }
    
    console.error('\n📖 For detailed setup instructions, see: EMAIL_SETUP.md\n');
    process.exit(1);
  }
};

// Run the test
testEmail();
