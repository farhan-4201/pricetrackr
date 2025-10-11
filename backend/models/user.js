import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    maxlength: [100, "Full name cannot exceed 100 characters"]
  },
  contactNumber: {
    type: String,
    required: function() {
      // Contact number not required for Google OAuth users
      return !this.googleId;
    },
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid contact number']
  },
  emailAddress: {
    type: String,
    required: [true, "Email address is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  passwordHash: {
    type: String,
    required: function() {
      // Password not required for Google OAuth users
      return !this.googleId;
    },
    minlength: [8, "Password must be at least 8 characters long"]
  },
  googleId: {
    type: String,
    sparse: true // Allows multiple null values but unique non-null values
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: null,
    trim: true
  },
  settings: {
    type: Object,
    default: {
      emailNotifications: true,
      smsNotifications: false,
      priceAlerts: true,
      productUpdates: true,
      darkMode: true,
      emailMarketing: false,
      dataCollection: true,
    }
  }
}, {
  timestamps: false // We manage createdAt manually
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to get user without password
UserSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.passwordHash;

  // Set default avatar if not set
  if (!user.profilePicture) {
    user.profilePicture = 'default-avatar.svg';
  }

  return user;
};

const User = mongoose.model("User", UserSchema);
export default User;
