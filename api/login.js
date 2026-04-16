import { connectDB } from "../lib/mangodb.js";

const demoUsers = [
  {
    role: "participant",
    username: "team1",
    password: "team@123"
  },
  {
    role: "participant",
    username: "team2",
    password: "team@123"
  },
  {
    role: "participant",
    username: "participant",
    password: "password123"
  },
  {
    role: "admin",
    email: "admin@startinno.com",
    password: "admin@123"
  },
  {
    role: "admin",
    email: "vijayavinashchekkapalli4@gmail.com",
    password: "Vijay@vi235"
  }
];

const SETTINGS_DOC_ID = "credentials-reset-state";

async function getCredentialsResetVersion(db) {
  try {
    const settings = await db.collection("appSettings").findOne({ _id: SETTINGS_DOC_ID });
    return Number(settings?.version) || 1;
  } catch (error) {
    return 1;
  }
}

function buildDemoResponse(role, user, credentialsResetVersion = 1) {
  const tokenData = role === "participant"
    ? `${user.username}:${user.password}:${role}`
    : `${user.email}:${user.password}:${role}`;

  const responseData = {
    success: true,
    message: "Login successful",
    token: Buffer.from(tokenData).toString("base64"),
    role,
    userId: `demo-${role}-${role === "participant" ? user.username : user.email}`,
    credentialsResetVersion
  };

  if (role === "participant") {
    responseData.username = user.username;
  } else {
    responseData.email = user.email;
  }

  return responseData;
}

/**
 * MongoDB-based Login API
 * Supports both Participant and Admin role-based login
 * 
 * Participant Login: { username, password, role: "participant" }
 * Admin Login: { email, password, role: "admin" }
 */
export default async function handler(req, res) {
  try {
    const invalidLoginMessage = "Invalid credentials";
    const { username, email, password, role } = req.body;

    console.log("🔐 [Login API] Authentication request");
    console.log(`   Role: ${role}`);

    // Validate role
    if (!role || !["participant", "admin"].includes(role)) {
      console.warn("❌ [Login API] Invalid role");
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'participant' or 'admin'"
      });
    }

    // Validate credentials based on role
    if (role === "participant") {
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required for participant login"
        });
      }
    } else if (role === "admin") {
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required for admin login"
        });
      }
    }

    let user = null;
    let credentialsResetVersion = 1;

    try {
      const db = await connectDB();
      const usersCollection = db.collection("users");
      credentialsResetVersion = await getCredentialsResetVersion(db);

      if (role === "participant") {
        console.log(`   Participant Login - Username: ${username}`);
        user = await usersCollection.findOne({
          username,
          password,
          role: "participant"
        });
      } else {
        console.log(`   Admin Login - Email: ${email}`);
        user = await usersCollection.findOne({
          email,
          password,
          role: "admin"
        });
      }
    } catch (dbError) {
      console.warn("⚠️ [Login API] MongoDB unavailable, using demo fallback:", dbError.message);
      const demoUser = demoUsers.find((entry) => {
        if (role === "participant") {
          return entry.role === role && entry.username === username && entry.password === password;
        }

        return entry.role === role && entry.email === email && entry.password === password;
      });

      if (demoUser) {
        return res.status(200).json(buildDemoResponse(role, demoUser, credentialsResetVersion));
      }

      return res.status(401).json({
        success: false,
        message: invalidLoginMessage
      });
    }

    if (!user) {
      console.warn(`❌ [Login API] User not found - Role: ${role}`);
      return res.status(401).json({
        success: false,
        message: invalidLoginMessage
      });
    }

    console.log("✅ [Login API] Authentication successful");

    const tokenData = role === "participant"
      ? `${username}:${password}:${role}`
      : `${email}:${password}:${role}`;
    const token = Buffer.from(tokenData).toString("base64");

    const responseData = {
      success: true,
      message: "Login successful",
      token,
      role,
      userId: user._id.toString(),
      credentialsResetVersion
    };

    if (role === "participant") {
      responseData.username = user.username;
    } else {
      responseData.email = user.email;
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error("❌ [Login API] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
}
