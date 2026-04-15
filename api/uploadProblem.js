import { connectDB } from "../lib/mangodb.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const db = await connectDB();
    console.log("✅ [uploadProblem API] MongoDB connected");

    // ==================== POST: CREATE NEW PROBLEM ====================
    if (req.method === "POST") {
      const { title, maxTeams, driveLink, uploadType } = req.body;

      console.log("📨 [uploadProblem API] POST request received");
      console.log(`   Title: ${title}`);
      console.log(`   Max Teams: ${maxTeams}`);
      console.log(`   Upload Type: ${uploadType}`);

      // Handle drive link upload (without requiring problem selection)
      if (uploadType === "drive_link" && driveLink) {
        console.log(`   Drive Link: ${driveLink}`);

        if (!driveLink || !driveLink.trim()) {
          return res.status(400).json({ 
            success: false,
            message: "Drive link is required" 
          });
        }

        // Process the drive link to extract file ID if it's a Google Drive link
        let pdfUrl = driveLink.trim();
        
        // If it's a Google Drive link, convert to direct preview if needed
        if (driveLink.includes("drive.google.com")) {
          // Check if it's already in the correct format
          if (!driveLink.includes("/preview") && !driveLink.includes("/view?usp=drive_link")) {
            // Try to extract file ID and create a proper preview link
            const fileMatch = driveLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (fileMatch && fileMatch[1]) {
              pdfUrl = `https://drive.google.com/file/d/${fileMatch[1]}/view`;
            }
          }
        }

        console.log(`✅ [uploadProblem API] Processing drive link: ${pdfUrl}`);

        try {
          // If we have a title, create a new problem with this link
          if (title && maxTeams) {
            const result = await db.collection("problems").insertOne({
              title: title,
              pdfUrl: pdfUrl,
              maxTeams: Number(maxTeams),
              selectedTeams: 0,
              createdAt: new Date()
            });

            console.log("✅ [uploadProblem API] Problem created with drive link:", result.insertedId);

            return res.status(200).json({
              success: true,
              message: "Problem added successfully with drive link",
              problemId: result.insertedId
            });
          } else {
            // Just update the latest problem with this link (admin quick upload)
            const problems = await db.collection("problems").find({})
              .sort({ createdAt: -1 })
              .limit(1)
              .toArray();

            if (problems.length === 0) {
              return res.status(404).json({ 
                success: false,
                message: "No problems exist. Please create a problem first." 
              });
            }

            const problemId = problems[0]._id;
            await db.collection("problems").updateOne(
              { _id: problemId },
              { $set: { pdfUrl: pdfUrl, updatedAt: new Date() } }
            );

            console.log("✅ [uploadProblem API] Latest problem updated with drive link:", problemId);

            return res.status(200).json({
              success: true,
              message: "Drive link uploaded successfully",
              problemId: problemId
            });
          }
        } catch (linkError) {
          console.error("❌ [uploadProblem API] Error processing drive link:", linkError);
          return res.status(500).json({
            success: false,
            message: "Failed to process drive link",
            error: linkError.message
          });
        }
      }

      // Handle regular problem creation without file
      if (!title || !maxTeams) {
        return res.status(400).json({ 
          success: false,
          message: "Title and maxTeams are required" 
        });
      }

      const result = await db.collection("problems").insertOne({
        title,
        pdfUrl: null, // Initially no PDF
        maxTeams: Number(maxTeams),
        selectedTeams: 0,
        createdAt: new Date()
      });

      console.log("✅ [uploadProblem API] Problem created with ID:", result.insertedId);

      return res.status(200).json({
        success: true,
        message: "Problem added successfully",
        problemId: result.insertedId
      });
    }

    // ==================== PUT: UPDATE PROBLEM PDF ====================
    else if (req.method === "PUT") {
      const { problemId, pdfUrl } = req.body;

      console.log("📨 [uploadProblem API] PUT request received");
      console.log(`   Problem ID: ${problemId}`);
      console.log(`   PDF URL: ${pdfUrl}`);

      if (!problemId || !pdfUrl) {
        return res.status(400).json({ 
          success: false,
          message: "problemId and pdfUrl are required" 
        });
      }

      // Validate ObjectId
      if (!ObjectId.isValid(problemId)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid problem ID" 
        });
      }

      const result = await db.collection("problems").updateOne(
        { _id: new ObjectId(problemId) },
        { $set: { pdfUrl: pdfUrl, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          success: false,
          message: "Problem not found" 
        });
      }

      console.log("✅ [uploadProblem API] PDF link updated for problem:", problemId);

      res.status(200).json({
        success: true,
        message: "PDF link uploaded successfully",
        problemId: problemId
      });
    }

    // ==================== METHOD NOT ALLOWED ====================
    else {
      console.warn("❌ [uploadProblem API] Invalid method:", req.method);
      return res.status(405).json({ 
        success: false,
        message: "Method not allowed" 
      });
    }

  } catch (error) {
    console.error("❌ [uploadProblem API] Error:", error.message);
    console.error("📋 Full error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to process request",
      message: error.message
    });
  }
}