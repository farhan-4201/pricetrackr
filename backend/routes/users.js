const express = require("express");
const User = require("../models/user");
const rateLimit = require("express-rate-limit");
const { authenticate, generateToken } = require("../middleware/auth");
const { validateRegistration, validateLogin, handleValidationErrors } = require("../middleware/validation");

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
      return res.status(400).json({ error: "Email address already registered" });
    }

    // Create new user
    const newUser = new User({
      fullName: fullName.trim(),
      contactNumber: contactNumber.trim(),
      emailAddress: emailAddress.toLowerCase(),
      passwordHash: password,
      profilePicture: 'default-avatar.svg' // Set default avatar
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser._id);

    const publicUser = newUser.getPublicProfile();

    res.status(201).json({
      message: "User registered successfully",
      user: publicUser,
      token
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

module.exports = router;
