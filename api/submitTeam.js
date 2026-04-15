import { connectDB } from "../lib/mangodb.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const { teamName, problemId } = req.body;

    console.log("📨 [submitTeam API] Request received");
    console.log(`   Team Name: ${teamName}`);
    console.log(`   Problem ID: ${problemId}`);

    const db = await connectDB();
    console.log("✅ [submitTeam API] MongoDB connected");

    const existing = await db.collection("submissions").findOne({ teamName });
    if (existing) {
      console.warn(`⚠️ [submitTeam API] Duplicate submission - Team "${teamName}" already exists`);
      return res.status(400).json({ message: "Team already submitted" });
    }

    const problem = await db.collection("problems").findOne({
      _id: new ObjectId(problemId)
    });

    if (!problem) {
      console.error(`❌ [submitTeam API] Problem not found with ID: ${problemId}`);
      return res.status(404).json({ message: "Problem not found" });
    }

    console.log(`📋 [submitTeam API] Problem found: ${problem.title}`);
    console.log(`   Teams selected: ${problem.selectedTeams}/${problem.maxTeams}`);

    if (problem.selectedTeams >= problem.maxTeams) {
      console.warn(`⚠️ [submitTeam API] Problem is full - limit reached`);
      return res.status(400).json({ message: "Limit reached" });
    }

    await db.collection("submissions").insertOne({
      teamName,
      problemId,
      submittedAt: new Date()
    });

    await db.collection("problems").updateOne(
      { _id: new ObjectId(problemId) },
      { $inc: { selectedTeams: 1 } }
    );

    console.log(`✅ [submitTeam API] Team "${teamName}" successfully submitted for problem "${problem.title}"`);

    res.status(200).json({ message: "Submitted successfully" });
  } catch (error) {
    console.error("❌ [submitTeam API] Error:", error.message);
    console.error("📋 Full error:", error);

    res.status(500).json({
      error: "Submission failed",
      message: error.message
    });
  }
}