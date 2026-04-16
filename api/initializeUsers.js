import { connectDB } from "../lib/mangodb.js";

/**
 * API to initialize test users in the database
 * Call this endpoint once to create test participants and admin users
 * 
 * Test Credentials:
 * Participant: username="team1", password="team@123"
 * Participant: username="team2", password="team@123"
 * Admin: email="admin@startinno.com", password="admin@123"
 */
export default async function handler(req, res) {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");

    // Check if users already exist
    const existingUsers = await usersCollection.countDocuments({});
    
    if (existingUsers > 0) {
      console.log("⚠️ [Init Users] Users already exist in database. Skipping initialization.");
      return res.status(200).json({
        success: true,
        message: "Database already initialized",
        userCount: existingUsers
      });
    }

    // Initialize test users
    const testUsers = [
      // Test Participants
      {
        username: "team1",
        password: "team@123",
        role: "participant",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: "team2",
        password: "team@123",
        role: "participant",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: "participant",
        password: "password123",
        role: "participant",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Test Admin
      {
        email: "admin@startinno.com",
        password: "admin@123",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: "vijayavinashchekkapalli4@gmail.com",
        password: "Vijay@vi235",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const result = await usersCollection.insertMany(testUsers);

    console.log(`✅ [Init Users] Created ${result.insertedIds.length} test users`);

    return res.status(201).json({
      success: true,
      message: `Initialized ${result.insertedIds.length} test users successfully`,
      users: {
        participants: [
          { username: "team1", password: "team@123" },
          { username: "team2", password: "team@123" },
          { username: "participant", password: "password123" }
        ],
        admins: [
          { email: "admin@startinno.com", password: "admin@123" },
          { email: "vijayavinashchekkapalli4@gmail.com", password: "Vijay@vi235" }
        ]
      }
    });

  } catch (error) {
    console.error("❌ [Init Users] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
}
