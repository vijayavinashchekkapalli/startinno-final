import { connectDB } from "../lib/mangodb.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const { problemId, title, pdfUrl, maxTeams } = req.body;

    console.log("✏️  [updateProblem API] Update request");
    console.log(`   Problem ID: ${problemId}`);
    console.log(`   Title: ${title}`);
    console.log(`   Max Teams: ${maxTeams}`);

    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: "Problem ID is required"
      });
    }

    const db = await connectDB();
    console.log("✅ [updateProblem API] MongoDB connected");

    const updateData = {};
    if (title) updateData.title = title;
    if (pdfUrl) updateData.pdfUrl = pdfUrl;
    if (maxTeams) updateData.maxTeams = Number(maxTeams);
    updateData.updatedAt = new Date();

    const result = await db.collection("problems").updateOne(
      { _id: new ObjectId(problemId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      console.warn("❌ [updateProblem API] Problem not found");
      return res.status(404).json({
        success: false,
        message: "Problem not found"
      });
    }

    console.log(`✅ [updateProblem API] Problem updated successfully`);

    return res.status(200).json({
      success: true,
      message: "Problem updated successfully"
    });

  } catch (error) {
    console.error("❌ [updateProblem API] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update problem",
      error: error.message
    });
  }
}
