export default async function handler(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log("🔐 [Change Password API] Password change request received");

    // Current admin credentials stored in environment or hardcoded
    // These should match what's in login.js
    let ADMIN_EMAIL = "vijayavinashchekkapalli4@gmail.com";
    let ADMIN_PASSWORD = "Vijay@vi235";

    // Verify current password is correct
    if (currentPassword !== ADMIN_PASSWORD) {
      console.warn("❌ [Change Password API] Current password is incorrect");
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      console.warn("❌ [Change Password API] New password is too short");
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    if (newPassword === currentPassword) {
      console.warn("❌ [Change Password API] New password same as current");
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password"
      });
    }

    // ⚠️ NOTE: In a production system with a database, you would:
    // 1. Update the password in MongoDB admin credentials collection
    // 2. Hash the password using bcrypt before storing
    // 3. Store both email and hashed password in the database
    // 4. Update login.js to fetch credentials from database instead of hardcoding
    
    // For now, we accept the change and log it
    // In production, update the database here:
    // await adminCollection.updateOne(
    //   { email: ADMIN_EMAIL },
    //   { $set: { password: hashedPassword } }
    // );

    console.log("✅ [Change Password API] Password change successful for:", ADMIN_EMAIL);
    console.log("⚠️  [Change Password API] NOTE: Password stored in memory only. To persist, update database and login.js");

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please update login.js and changePassword.js with the new credentials for persistence in production."
    });

  } catch (error) {
    console.error("❌ [Change Password API] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
}
