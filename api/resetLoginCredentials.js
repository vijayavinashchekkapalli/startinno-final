import { connectDB } from "../lib/mangodb.js";

const SETTINGS_DOC_ID = "credentials-reset-state";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const db = await connectDB();
    const settingsCollection = db.collection("appSettings");

    const existing = await settingsCollection.findOne({ _id: SETTINGS_DOC_ID });
    const currentVersion = Number(existing?.version) || 1;
    const nextVersion = currentVersion + 1;

    await settingsCollection.updateOne(
      { _id: SETTINGS_DOC_ID },
      {
        $set: {
          version: nextVersion,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Login credentials reset applied",
      credentialsResetVersion: nextVersion
    });
  } catch (error) {
    console.error("❌ [resetLoginCredentials API] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to reset login credentials"
    });
  }
}