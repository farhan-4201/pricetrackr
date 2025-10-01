import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import User from "../models/user.js";
import { generateToken } from "./auth.js";

// Configure Passport Google OAuth2 Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/api/v1/users/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google profile:", profile);

        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update last login
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if user exists with same email (to avoid duplicate accounts)
        const existingUser = await User.findOne({
          emailAddress: profile.emails[0].value.toLowerCase()
        });

        if (existingUser) {
          // Link Google account to existing user
          existingUser.googleId = profile.id;
          existingUser.lastLogin = new Date();
          // Set profile picture from Google if not set
          if (!existingUser.profilePicture || existingUser.profilePicture === 'default-avatar.svg') {
            existingUser.profilePicture = profile.photos[0].value;
          }
          await existingUser.save();
          return done(null, existingUser);
        }

        // Create new user
        const newUser = new User({
          fullName: profile.displayName,
          emailAddress: profile.emails[0].value.toLowerCase(),
          googleId: profile.id,
          profilePicture: profile.photos[0].value || 'default-avatar.svg',
          lastLogin: new Date()
        });

        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session (required by passport)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session (required by passport)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
