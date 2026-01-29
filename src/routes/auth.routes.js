const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Imports your User model
const auth = require("../middleware/auth");

const router = express.Router();

// Helper to create a token
function signToken(userId) {
  // We use 'userId' as the key to match your auth middleware
  return jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// ✅ REGISTER ROUTE
router.post("/register", async (req, res) => {
  try {
    // 1. Get data from Frontend
    const { first, last, email, pass } = req.body;

    // 2. Validate inputs
    if (!email || !pass || !first || !last) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 3. Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // 4. Create the User
    // We combine 'first' and 'last' into 'name' because your User.js model requires 'name'
    const user = new User({
      name: `${first} ${last}`, 
      email: email.toLowerCase(),
      password: pass // Your User.js file will automatically hash this!
    });

    await user.save();

    // 5. Generate Token and Send Response
    const token = signToken(user._id);
    
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find User
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Check Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Send Token
    const token = signToken(user._id);
    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ GET CURRENT USER
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ LOGOUT (Stateless)
router.post("/logout", (req, res) => {
  // Since we use JWTs stored in frontend localStorage, 
  // the backend just needs to return OK.
  res.json({ message: "Logged out successfully" });
});

const crypto = require("crypto"); // Make sure this is imported at the top!

// ✅ FORGOT PASSWORD
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Security: Don't reveal if user exists. Just say "If account exists, email sent"
      return res.json({ message: "If that email exists, we sent a reset code." });
    }

    // 1. Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Hash it before saving to DB (Security best practice)
    user.resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // 3. Set expiration (15 minutes from now)
    user.resetTokenExp = Date.now() + 15 * 60 * 1000;

    await user.save();

    // ⚠️ IMPORTANT: Since we don't have an email server (SendGrid/Nodemailer),
    // we will send the token back in the response so you can copy-paste it.
    res.json({ 
      message: "Reset code generated (Demo Mode)", 
      resetToken: resetToken 
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ RESET PASSWORD
router.post("/reset", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // 1. Hash the token user sent to compare with DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // 2. Find user with this token AND make sure it hasn't expired
    const user = await User.findOne({
      resetTokenHash: hashedToken,
      resetTokenExp: { $gt: Date.now() } // $gt means "Greater Than" now
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // 3. Save new password (User.js pre-save hook will hash it automatically)
    user.password = newPassword;
    
    // 4. Clear the reset token fields
    user.resetTokenHash = undefined;
    user.resetTokenExp = undefined;
    
    await user.save();

    res.json({ message: "Password reset successful! Please login." });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


module.exports = router;
