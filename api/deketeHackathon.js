import { connectDB } from "../lib/mangodb.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const { problemId, deleteAll } = req.body;

    console.log("🗑️  [deleteProblem API] Delete request");
    
    const db = await connectDB();
    console.log("✅ [deleteProblem API] MongoDB connected");

    // Handle delete all teams and submissions
    if (deleteAll === true) {
      console.log("🗑️  [deleteProblem API] Deleting ALL teams and submissions...");
      
      const deleteSubmissions = await db.collection("submissions").deleteMany({});
      
      console.log(`✅ [deleteProblem API] All submissions deleted`);
      console.log(`   Deleted records: ${deleteSubmissions.deletedCount}`);

      return res.status(200).json({
        success: true,
        message: "All team details and submissions deleted successfully",
        deletedCount: deleteSubmissions.deletedCount
      });
    }

    // Handle delete single problem
    console.log(`   Problem ID: ${problemId}`);

    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: "Problem ID is required"
      });
    }

    // Delete the problem
    const deleteResult = await db.collection("problems").deleteOne({
      _id: new ObjectId(problemId)
    });

    if (deleteResult.deletedCount === 0) {
      console.warn("❌ [deleteProblem API] Problem not found");
      return res.status(404).json({
        success: false,
        message: "Problem not found"
      });
    }

    // Also delete all submissions for this problem
    const deleteSubmissions = await db.collection("submissions").deleteMany({
      problemId: new ObjectId(problemId)
    });

    console.log(`✅ [deleteProblem API] Problem deleted`);
    console.log(`   Deleted submissions: ${deleteSubmissions.deletedCount}`);

    return res.status(200).json({
      success: true,
      message: "Problem and related submissions deleted successfully"
    });

  } catch (error) {
    console.error("❌ [deleteProblem API] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete problem",
      error: error.message
    });
  }
}
