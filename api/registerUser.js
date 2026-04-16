import { connectDB } from "../lib/mangodb.js";

/**
 * API to register a new user (for testing/setup)
 * Accepts: POST request with { username, email, password, role }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    if (role === "participant") {
      if (!username) {
        return res.status(400).json({ success: false, message: "Username is required for participant" });
      }
    } else if (role === "admin") {
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required for admin" });
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid role. Must be 'participant' or 'admin'" });
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    // Check if user already exists
    let existingUser;
    if (role === "participant") {
      existingUser = await usersCollection.findOne({ username, role: "participant" });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Username already exists" });
      }
    } else if (role === "admin") {
      existingUser = await usersCollection.findOne({ email, role: "admin" });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Email already exists" });
      }
    }

    // Create new user
    const newUser = {
      role,
      password, // In production, hash this password with bcrypt!
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (role === "participant") {
      newUser.username = username;
    } else if (role === "admin") {
      newUser.email = email;
    }

    const result = await usersCollection.insertOne(newUser);

    console.log(`✅ [Register API] New ${role} user created: ${result.insertedId}`);

    return res.status(201).json({
      success: true,
      message: `${role} user registered successfully`,
      userId: result.insertedId,
      role: role
    });

  } catch (error) {
    console.error("❌ [Register API] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
}
