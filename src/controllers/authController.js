import crypto from "crypto";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // 1. Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Hash token (store in DB)
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 3. Token expiry (15 min)
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    // 4. Reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // 5. Send email
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `
        <p>You requested a password reset.</p>
        <p>Click below to reset:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({ message: "Reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = password; // password hashing middleware should exist
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
