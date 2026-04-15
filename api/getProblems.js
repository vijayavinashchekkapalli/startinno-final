import { connectDB } from "../lib/mangodb.js";

export default async function handler(req, res) {
  try {
    console.log("📨 [getProblems API] Request received");

    const db = await connectDB();
    console.log("✅ [getProblems API] MongoDB connected");

    const problems = await db.collection("problems").find({}).toArray();
    console.log(`📦 [getProblems API] Found ${problems.length} problems:`, problems);

    // Return with proper headers
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(problems);
  } catch (error) {
    console.error("❌ [getProblems API] Error:", error.message);
    console.error("📋 Full error:", error);

    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      error: "Failed to fetch problems",
      message: error.message,
      problems: [] // Return empty array as fallback
    });
  }
}
