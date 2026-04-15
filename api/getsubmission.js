import { connectDB } from "../lib/mangodb.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    console.log("📨 [getSubmissions API] Request received");

    const db = await connectDB();
    console.log("✅ [getSubmissions API] MongoDB connected");

    const submissions = await db.collection("submissions").aggregate([
      {
        $addFields: {
          problemId_obj: { $toObjectId: "$problemId" }
        }
      },
      {
        $lookup: {
          from: "problems",
          localField: "problemId_obj",
          foreignField: "_id",
          as: "problem"
        }
      },
      {
        $project: {
          problemId_obj: 0
        }
      },
      { $sort: { submittedAt: -1 } }
    ]).toArray();

    console.log(`📦 [getSubmissions API] Found ${submissions.length} submissions`);

    return res.status(200).json(submissions);

  } catch (error) {
    console.error("❌ [getSubmissions API] Error:", error.message);
    return res.status(500).json({
      error: "Failed to fetch submissions",
      message: error.message
    });
  }
}