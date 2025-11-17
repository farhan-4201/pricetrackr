import express from "express";
import passport from "../middleware/googleAuth.js";
import User from "../models/user.js";
import rateLimit from "express-rate-limit";
import { authenticate, generateToken } from "../middleware/auth.js";
import { validateRegistration, validateLogin, handleValidationErrors } from "../middleware/validation.js";
import sendMail from "../utils/mailer.js";
import {
  generateVerificationToken,
  getVerificationTokenExpiry,
  createVerificationEmailTemplate,
  createResendVerificationEmailTemplate
} from "../utils/verification.js";

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: (process.env.LOGIN_TIME_WINDOW || 15) * 60 * 1000, // Default 15 minutes
  max: process.env.LOGIN_ATTEMPTS_LIMIT || 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many authentication attempts from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get all users (protected route for admin)
router.get("/", authenticate, async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by email address (for login verification)
router.get("/email/:emailAddress", async (req, res) => {
  try {
    const user = await User.findOne({ emailAddress: req.params.emailAddress.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const publicUser = user.getPublicProfile();
    res.json(publicUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Get current user profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.getPublicProfile());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Register new user
router.post("/register", validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { fullName, contactNumber, emailAddress, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ emailAddress: emailAddress.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: "Email address already registered. Please use a different email or try signing in."
      });
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = getVerificationTokenExpiry();

    // Create new user (unverified)
    const newUser = new User({
      fullName: fullName.trim(),
      contactNumber: contactNumber.trim(),
      emailAddress: emailAddress.toLowerCase(),
      passwordHash: password,
      isVerified: false,
      verificationToken: verificationToken,
      verificationTokenExpiry: verificationTokenExpiry,
      profilePicture: 'default-avatar.svg' // Set default avatar
    });

    await newUser.save();

    // Create verification URL
    const frontendBase = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:5173';
    const verificationUrl = `${frontendBase}/verify-email?token=${verificationToken}`;

    // Send verification email
    try {
      const emailHtml = createVerificationEmailTemplate(newUser.fullName, verificationUrl);
      await sendMail(
        newUser.emailAddress,
        "Welcome to PriceTrackr - Verify Your Email",
        emailHtml
      );
      console.log(`✅ Verification email sent to ${newUser.emailAddress}`);
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
      // Continue with registration even if email fails, as user can request resend
    }

    const publicUser = newUser.getPublicProfile();

    res.status(201).json({
      message: "Account created successfully! Please check your email and click the verification link to activate your account.",
      user: {
        ...publicUser,
        isVerified: false
      },
      requiresVerification: true
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message || "Registration failed" });
  }
});

// Login user
router.post("/login", authLimiter, validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { emailAddress, password } = req.body;

    // Find user by email address
    const user = await User.findOne({ emailAddress: emailAddress.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email address or password" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        error: "Please verify your email address before signing in. Check your email for the verification link.",
        requiresVerification: true,
        isVerified: false
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email address or password" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    const publicUser = user.getPublicProfile();

    res.json({
      message: "Login successful",
      user: publicUser,
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Logout user (client-side token removal)
router.post("/logout", authenticate, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Get user settings
router.get("/settings", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user settings or defaults
    const settings = user.settings || {
      emailNotifications: true,
      smsNotifications: false,
      priceAlerts: true,
      productUpdates: true,
      darkMode: true,
      emailMarketing: false,
      dataCollection: true,
    };
    
    res.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Update user settings
router.put("/settings", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update settings
    user.settings = {
      ...user.settings,
      ...req.body
    };
    
    await user.save();
    
    res.json({
      message: "Settings updated successfully",
      settings: user.settings
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Google OAuth routes
router.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin` }),
  async (req, res) => {
    try {
      // User is authenticated and available in req.user
      const user = req.user;

      // Generate JWT token
      const token = generateToken(user._id);

      // Build redirect base from env (fallback to localhost for dev)
      const frontendBase = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:5173';

      // Redirect to frontend with token
      res.redirect(`${frontendBase}/auth/google?token=${token}&user=${encodeURIComponent(JSON.stringify(user.getPublicProfile()))}`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      const frontendBase = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:5173';
      res.redirect(`${frontendBase}/signin?error=oauth_failed`);
    }
  }
);

// Verify email endpoint
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    // Find user with matching verification token
    const user = await User.findOne({
      verificationToken: token,
      isVerified: false
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired verification token. Please request a new verification email."
      });
    }

    // Check if token has expired
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      return res.status(400).json({
        error: "Verification token has expired. Please request a new verification email.",
        expired: true
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = null; // Clear the token
    user.verificationTokenExpiry = null; // Clear expiry
    await user.save();

    console.log(`✅ User ${user.emailAddress} email verified successfully`);

    res.json({
      message: "Email verified successfully! You can now sign in to your account.",
      success: true
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Email verification failed" });
  }
});

// Resend verification email endpoint
router.post("/resend-verification", async (req, res) => {
  try {
    const { emailAddress } = req.body;

    if (!emailAddress) {
      return res.status(400).json({ error: "Email address is required" });
    }

    // Find user by email
    const user = await User.findOne({
      emailAddress: emailAddress.toLowerCase(),
      isVerified: false,
      isActive: true
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        message: "If the email address exists and is unverified, a new verification email has been sent."
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = getVerificationTokenExpiry();

    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();

    // Create verification URL
    const frontendBase = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:5173';
    const verificationUrl = `${frontendBase}/verify-email?token=${verificationToken}`;

    // Send verification email
    try {
      const emailHtml = createResendVerificationEmailTemplate(user.fullName, verificationUrl, 3); // Assume 3 attempts remaining for now
      await sendMail(
        user.emailAddress,
        "PriceTrackr - Verify Your Email Address",
        emailHtml
      );
      console.log(`✅ Resend verification email sent to ${user.emailAddress}`);
    } catch (emailError) {
      console.error("❌ Failed to send resend verification email:", emailError);
      return res.status(500).json({ error: "Failed to send verification email" });
    }

    res.json({
      message: "New verification email sent successfully. Please check your email."
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

// Check verification status endpoint
router.get("/verification-status/:emailAddress", async (req, res) => {
  try {
    const { emailAddress } = req.params;

    const user = await User.findOne({
      emailAddress: emailAddress.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      emailAddress: user.emailAddress,
      isVerified: user.isVerified,
      fullName: user.fullName
    });
  } catch (error) {
    console.error("Verification status check error:", error);
    res.status(500).json({ error: "Failed to check verification status" });
  }
});

export default router;
