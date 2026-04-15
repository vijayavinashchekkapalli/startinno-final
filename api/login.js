export default async function handler(req, res) {
  try {
    const { email, password } = req.body;

    console.log("🔐 [Login API] Authentication request");
    console.log(`   Email: ${email}`);

    // Updated hardcoded authentication with new credentials
    const ADMIN_EMAIL = "vijayavinashchekkapalli4@gmail.com";
    const ADMIN_PASSWORD = "Vijay@vi235"; // Updated admin password

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log("✅ [Login API] Authentication successful");
      
      // In production, generate JWT token
      const token = Buffer.from(`${email}:${password}`).toString('base64');
      
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token: token,
        email: email
      });
    } else {
      console.warn("❌ [Login API] Invalid credentials");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

  } catch (error) {
    console.error("❌ [Login API] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
}
