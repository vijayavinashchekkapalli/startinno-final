// ==================== API HELPER FUNCTIONS ====================
// This file contains utility functions for API calls

const API_BASE = "/api";

// ==================== AUTH API ====================

async function loginAdmin(email, password) {
  console.log("🔐 [API Helper] Logging in admin...");
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return { success: res.ok, data };
  } catch (error) {
    console.error("❌ [API Helper] Login error:", error);
    return { success: false, error: error.message };
  }
}

// ==================== PROBLEMS API ====================

async function fetchProblems() {
  console.log("📥 [API Helper] Fetching problems...");
  try {
    const res = await fetch(`${API_BASE}/getProblems`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("❌ [API Helper] Fetch problems error:", error);
    return { success: false, error: error.message };
  }
}

async function createProblem(title, pdfUrl, maxTeams) {
  console.log("📤 [API Helper] Creating problem...");
  try {
    const res = await fetch(`${API_BASE}/uploadProblem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, pdfUrl, maxTeams })
    });
    const data = await res.json();
    return { success: res.ok, data };
  } catch (error) {
    console.error("❌ [API Helper] Create problem error:", error);
    return { success: false, error: error.message };
  }
}

async function updateProblem(problemId, title, pdfUrl, maxTeams) {
  console.log("✏️  [API Helper] Updating problem...");
  try {
    const res = await fetch(`${API_BASE}/updateProblem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId, title, pdfUrl, maxTeams })
    });
    const data = await res.json();
    return { success: data.success, data };
  } catch (error) {
    console.error("❌ [API Helper] Update problem error:", error);
    return { success: false, error: error.message };
  }
}

async function deleteProblem(problemId) {
  console.log("🗑️  [API Helper] Deleting problem...");
  try {
    const res = await fetch(`${API_BASE}/deketeHackathon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId })
    });
    const data = await res.json();
    return { success: data.success, data };
  } catch (error) {
    console.error("❌ [API Helper] Delete problem error:", error);
    return { success: false, error: error.message };
  }
}

// ==================== SUBMISSIONS API ====================

async function submitTeam(teamName, problemId) {
  console.log("📤 [API Helper] Submitting team...");
  try {
    const res = await fetch(`${API_BASE}/submitTeam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName, problemId })
    });
    const data = await res.json();
    return { success: res.ok, data };
  } catch (error) {
    console.error("❌ [API Helper] Submit team error:", error);
    return { success: false, error: error.message };
  }
}

async function fetchSubmissions() {
  console.log("📥 [API Helper] Fetching submissions...");
  try {
    const res = await fetch(`${API_BASE}/getsubmission`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("❌ [API Helper] Fetch submissions error:", error);
    return { success: false, error: error.message };
  }
}

console.log("✅ [API Helper] api.js loaded successfully");
