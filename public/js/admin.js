let authToken = null;
let adminEmail = null;
let participantUsername = null;
let currentRole = "participant"; // Default role
let problemToDelete = null;
let problemToEdit = null;
let adminProblemsCache = [];
let adminSubmissionsCache = [];
const INVALID_LOGIN_MESSAGE = "Invalid credentials";

function clearAdminSessionStorage() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("adminEmail");
  localStorage.removeItem("userRole");
}

function decodeSessionToken(token) {
  try {
    const decoded = atob(token || "");
    const parts = decoded.split(":");

    if (parts.length < 3) {
      return null;
    }

    return {
      identifier: parts[0],
      password: parts[1],
      role: parts[2]
    };
  } catch (error) {
    return null;
  }
}

async function validateStoredAdminSession(savedToken) {
  const decoded = decodeSessionToken(savedToken);

  if (!decoded || decoded.role !== "admin") {
    return { valid: false };
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: decoded.identifier,
        password: decoded.password,
        role: "admin"
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { valid: false };
    }

    return { valid: true, data };
  } catch (error) {
    return { valid: false };
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSubmissionProblemId(submission) {
  if (submission.problemId) {
    return String(submission.problemId);
  }

  if (submission.problem && submission.problem[0] && submission.problem[0]._id) {
    return String(submission.problem[0]._id);
  }

  return null;
}

function formatSubmissionDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function renderDashboard() {
  const statsContainer = document.getElementById("dashboardStats");
  const breakdownContainer = document.getElementById("problemSelectionBreakdown");

  if (!statsContainer || !breakdownContainer) {
    return;
  }

  const problems = Array.isArray(adminProblemsCache) ? adminProblemsCache : [];
  const submissions = Array.isArray(adminSubmissionsCache) ? adminSubmissionsCache : [];

  const totalProblems = problems.length;
  const totalTeamLimit = problems.reduce((sum, problem) => sum + (Number(problem.maxTeams) || 0), 0);
  const submittedTeams = new Set(
    submissions
      .map((submission) => String(submission.teamName || "").trim())
      .filter(Boolean)
  ).size;
  const teamsYetToSubmit = Math.max(totalTeamLimit - submittedTeams, 0);

  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">📄</div>
      <div class="stat-content">
        <p class="stat-label">Total Problems</p>
        <p class="stat-value">${totalProblems}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-content">
        <p class="stat-label">Total Team Limit</p>
        <p class="stat-value">${totalTeamLimit}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✅</div>
      <div class="stat-content">
        <p class="stat-label">Teams Submitted</p>
        <p class="stat-value">${submittedTeams}</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">⏳</div>
      <div class="stat-content">
        <p class="stat-label">Teams Yet To Submit</p>
        <p class="stat-value">${teamsYetToSubmit}</p>
      </div>
    </div>
  `;

  if (problems.length === 0) {
    breakdownContainer.innerHTML = '<p class="empty-message">No problem statements available yet.</p>';
    return;
  }

  const cardsHtml = problems.map((problem) => {
    const problemId = String(problem._id);
    const teamNames = submissions
      .filter((submission) => getSubmissionProblemId(submission) === problemId)
      .map((submission) => submission.teamName)
      .filter(Boolean);

    const teamsHtml = teamNames.length > 0
      ? `<ul class="team-names-list">${teamNames.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}</ul>`
      : '<p class="no-teams-text">No teams selected yet.</p>';

    return `
      <div class="selection-card">
        <div class="selection-card-header">
          <h3>${escapeHtml(problem.title || "Untitled Problem")}</h3>
          <span class="selection-count">${Number(problem.selectedTeams) || 0} / ${Number(problem.maxTeams) || 0}</span>
        </div>
        <div class="selection-card-body">
          <p class="selection-label">Selected Team Names</p>
          ${teamsHtml}
        </div>
      </div>
    `;
  }).join("");

  breakdownContainer.innerHTML = cardsHtml;
}

async function downloadSubmissionReport() {
  console.log("⬇️ [Admin] Generating submission report...");

  try {
    const [problemsRes, submissionsRes] = await Promise.all([
      fetch("/api/getProblems?t=" + Date.now()),
      fetch("/api/getsubmission?t=" + Date.now())
    ]);

    if (!problemsRes.ok) {
      throw new Error(`Failed to fetch problems (HTTP ${problemsRes.status})`);
    }

    if (!submissionsRes.ok) {
      throw new Error(`Failed to fetch submissions (HTTP ${submissionsRes.status})`);
    }

    const problems = await problemsRes.json();
    const submissions = await submissionsRes.json();

    const generatedAt = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    const submittedTeamCount = submissions.filter((submission) => {
      const teamName = String(submission.teamName || "").trim();
      return teamName.length > 0;
    }).length;

    const problemLookup = new Map(problems.map((problem) => [String(problem._id), problem]));

    const groupedSubmissions = submissions.reduce((groups, submission) => {
      const teamName = String(submission.teamName || "").trim();

      if (!teamName) {
        return groups;
      }

      const problemId = getSubmissionProblemId(submission);
      const matchedProblem = problemId ? problemLookup.get(problemId) : null;
      const problemTitle = matchedProblem?.title || submission.problem?.[0]?.title || "Untitled Problem";
      const groupKey = problemTitle.toLowerCase();

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          title: problemTitle,
          teams: []
        });
      }

      groups.get(groupKey).teams.push(teamName);
      return groups;
    }, new Map());

    const sortedProblemGroups = Array.from(groupedSubmissions.values())
      .map((group) => ({
        title: group.title,
        teams: group.teams.sort((left, right) => left.localeCompare(right))
      }))
      .sort((left, right) => left.title.localeCompare(right.title));

    const submissionSections = sortedProblemGroups.map((group) => {
      const teamRows = group.teams.map((teamName, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(teamName)}</td>
        </tr>
      `).join("");

      return `
        <h2>${escapeHtml(group.title)}</h2>
        <p><strong>Selected Teams:</strong> ${group.teams.length}</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Team Name</th>
            </tr>
          </thead>
          <tbody>
            ${teamRows}
          </tbody>
        </table>
      `;
    }).join("<hr />");

    const reportHtml = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>StartInno Submissions Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
            h1 { margin-bottom: 4px; }
            h2 { margin-top: 28px; margin-bottom: 8px; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 18px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            hr { border: none; border-top: 1px solid #ddd; margin: 26px 0; }
          </style>
        </head>
        <body>
          <h1>StartInno Hackathon - Submission Report</h1>
          <p><strong>Generated At:</strong> ${escapeHtml(generatedAt)}</p>
          <p><strong>Total Problems:</strong> ${problems.length}</p>
          <p><strong>Submitted Teams:</strong> ${submittedTeamCount}</p>
          <hr />
          ${submissionSections || "<p>No teams have submitted yet.</p>"}
        </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: "application/msword" });
    const reportUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    link.href = reportUrl;
    link.download = `startinno-submissions-report-${timestamp}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(reportUrl);

    console.log("✅ [Admin] Submission report downloaded");
  } catch (error) {
    console.error("❌ [Admin] Report generation failed:", error);
    alert("Failed to download report: " + error.message);
  }
}

// ==================== ROLE SELECTION ====================

function selectRole(role) {
  currentRole = role;
  
  // Update role button styles
  const participantBtn = document.getElementById("participantRoleBtn");
  const adminBtn = document.getElementById("adminRoleBtn");
  
  const participantForm = document.getElementById("participantLoginForm");
  const adminForm = document.getElementById("adminLoginForm");
  
  if (role === "participant") {
    participantBtn.classList.add("active");
    adminBtn.classList.remove("active");
    participantForm.classList.add("active");
    participantForm.style.display = "block";
    adminForm.classList.remove("active");
    adminForm.style.display = "none";
  } else {
    participantBtn.classList.remove("active");
    adminBtn.classList.add("active");
    participantForm.classList.remove("active");
    participantForm.style.display = "none";
    adminForm.classList.add("active");
    adminForm.style.display = "block";
  }
  
  // Clear error message
  hideLoginError();
  
  // Clear previous form values
  document.getElementById("participantUsername").value = "";
  document.getElementById("participantPassword").value = "";
  document.getElementById("adminEmail").value = "";
  document.getElementById("adminPassword").value = "";
  
  console.log(`✅ [Auth] Switched to ${role} login`);
}

function showLoginError(message) {
  const errorDiv = document.getElementById("loginError");
  errorDiv.textContent = message;
  errorDiv.classList.add("show");
}

function hideLoginError() {
  const errorDiv = document.getElementById("loginError");
  errorDiv.classList.remove("show");
}

function handleLoginKeyPress(event) {
  if (event.key === "Enter") {
    if (currentRole === "participant") {
      participantLogin();
    } else {
      adminLogin();
    }
  }
}

// ==================== PARTICIPANT LOGIN ====================

async function participantLogin() {
  const username = document.getElementById("participantUsername").value.trim();
  const password = document.getElementById("participantPassword").value.trim();

  if (!username || !password) {
    showLoginError("Please enter username and password");
    return;
  }

  console.log("🔐 [Participant] Attempting login...");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role: "participant" })
    });

    const data = await res.json();
    console.log("📊 [Participant] Login response:", data);

    if (res.ok && data.success) {
      console.log("✅ [Participant] Login successful");
      authToken = data.token;
      participantUsername = data.username;
      currentRole = "participant";

      // Save to localStorage
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("participantUsername", participantUsername);
      localStorage.setItem("userRole", "participant");

      // Redirect to user home page
      window.location.href = "/index.html";
    } else {
      console.warn("❌ [Participant] Login failed:", data.message);
      showLoginError(INVALID_LOGIN_MESSAGE);
    }
  } catch (error) {
    console.error("❌ [Participant] Login error:", error);
    showLoginError(INVALID_LOGIN_MESSAGE);
  }
}

// ==================== ADMIN LOGIN ====================

async function adminLogin() {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  if (!email || !password) {
    showLoginError("Please enter email and password");
    return;
  }

  console.log("🔐 [Admin] Attempting login...");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "admin" })
    });

    const data = await res.json();
    console.log("📊 [Admin] Login response:", data);

    if (res.ok && data.success) {
      console.log("✅ [Admin] Login successful");
      authToken = data.token;
      adminEmail = data.email;
      currentRole = "admin";

      // Save to localStorage
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("adminEmail", adminEmail);
      localStorage.setItem("userRole", "admin");

      hideLoginError();

      // Show admin panel
      document.getElementById("loginContainer").style.display = "none";
      document.getElementById("adminContainer").style.display = "block";
      document.getElementById("adminEmailDisplay").textContent = adminEmail;

      // Load data
      loadStatements();
      loadSubmissions();
    } else {
      console.warn("❌ [Admin] Login failed:", data.message);
      clearAdminSessionStorage();
      showLoginError(INVALID_LOGIN_MESSAGE);
    }
  } catch (error) {
    console.error("❌ [Admin] Login error:", error);
    clearAdminSessionStorage();
    showLoginError(INVALID_LOGIN_MESSAGE);
  }
}

// ==================== LOGOUT ====================

function adminLogout() {
  console.log("🚪 [Admin] Logging out...");
  authToken = null;
  adminEmail = null;
  currentRole = "participant";
  clearAdminSessionStorage();

  // Always return to the main login page with StartInno logo background.
  window.location.href = "/index.html";
}

// ==================== CHECK AUTH ON LOAD ====================

window.addEventListener("DOMContentLoaded", async function() {
  console.log("✅ [Admin] Page loaded");
  const savedToken = localStorage.getItem("authToken");
  const savedRole = localStorage.getItem("userRole");
  
  if (savedToken && savedRole === "admin") {
    const validation = await validateStoredAdminSession(savedToken);

    if (validation.valid) {
      authToken = validation.data.token;
      adminEmail = validation.data.email || localStorage.getItem("adminEmail") || "";
      currentRole = "admin";

      localStorage.setItem("authToken", authToken);
      localStorage.setItem("adminEmail", adminEmail);
      localStorage.setItem("userRole", "admin");

      document.getElementById("loginContainer").style.display = "none";
      document.getElementById("adminContainer").style.display = "block";
      document.getElementById("adminEmailDisplay").textContent = adminEmail;

      console.log("✅ [Admin] Restored session for:", adminEmail);
      loadStatements();
      loadSubmissions();
      return;
    }

    clearAdminSessionStorage();
  }

  // If admin session is not valid, redirect to normal login page.
  window.location.href = "/index.html";
});

// ==================== STATEMENTS MANAGEMENT ====================

async function loadStatements() {
  console.log("📥 [Admin] Loading problem statements...");

  try {
    const res = await fetch("/api/getProblems");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const problems = await res.json();
    adminProblemsCache = Array.isArray(problems) ? problems : [];
    console.log("✅ [Admin] Loaded statements:", problems);

    const container = document.getElementById("statementsList");
    container.innerHTML = "";

    if (!Array.isArray(problems) || problems.length === 0) {
      container.innerHTML = '<p class="empty-message">No problem statements added yet. Click "Add Problem Statement" to create one.</p>';
      renderDashboard();
      return;
    }

    renderDashboard();

    problems.forEach(statement => {
      const card = document.createElement("div");
      card.className = "statement-card-admin";

      card.innerHTML = `
        <div class="statement-info">
          <div class="statement-header-admin">
            <h3>${statement.title}</h3>
            <span class="limit-badge">Limit: ${statement.maxTeams}</span>
          </div>
          <p class="teams-info">Teams Registered: ${statement.selectedTeams || 0}</p>
        </div>
        
        <div class="statement-actions">
          <button onclick="openEditModal('${statement._id}', '${statement.title.replace(/'/g, "\\'")}', ${statement.maxTeams})" class="btn-warning">✏️ Edit</button>
          <button onclick="deleteStatement('${statement._id}', '${statement.title.replace(/'/g, "\\'")}')" class="btn-danger">🗑️ Delete</button>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (error) {
    console.error("❌ [Admin] Error loading statements:", error);
    document.getElementById("statementsList").innerHTML = `<p class="error-message">Error loading statements: ${error.message}</p>`;
    adminProblemsCache = [];
    renderDashboard();
  }
}

function toggleAddStatementForm() {
  const form = document.getElementById("addStatementForm");
  form.style.display = form.style.display === "none" ? "block" : "none";

  if (form.style.display === "block") {
    document.getElementById("statementTitle").value = "";
    document.getElementById("statementMaxTeams").value = "";
    document.getElementById("statementTitle").focus();
  }
}

async function addNewStatement() {
  const title = document.getElementById("statementTitle").value.trim();
  const maxTeams = document.getElementById("statementMaxTeams").value;

  if (!title || !maxTeams) {
    console.warn("⚠️ [Admin] Missing required fields");
    alert("Please fill in Title and Max Teams/Limit");
    return;
  }

  console.log("📤 [Admin] Creating new problem statement...");
  console.log(`   Title: ${title}`);
  console.log(`   Max Teams: ${maxTeams}`);

  try {
    const res = await fetch("/api/uploadProblem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title: title,
        maxTeams: parseInt(maxTeams)
      })
    });

    const data = await res.json();
    console.log("📊 [Admin] Response:", data);

    if (res.ok) {
      console.log("✅ [Admin] Statement created successfully");
      alert("✅ Problem statement added successfully!");
      toggleAddStatementForm();
      loadStatements();
    } else {
      console.warn("❌ [Admin] Failed to add statement");
      alert(data.message || "Failed to add statement");
    }
  } catch (error) {
    console.error("❌ [Admin] Error:", error);
    alert("Error: " + error.message);
  }
}

function deleteStatement(statementId, title) {
  console.log("🗑️ [Admin] Opening delete confirmation for statement:", statementId);

  problemToDelete = statementId;
  document.getElementById("deleteMessage").textContent = `Delete statement "${title}"?`;
  document.getElementById("deleteModal").style.display = "block";
}

// ==================== SUBMISSIONS MANAGEMENT ====================

async function loadSubmissions() {
  console.log("📥 [Admin] Loading submissions...");

  try {
    const res = await fetch("/api/getsubmission?t=" + Date.now()); // Bypass cache
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const submissions = await res.json();
    adminSubmissionsCache = Array.isArray(submissions) ? submissions : [];
    console.log("✅ [Admin] Loaded submissions:", submissions);

    const container = document.getElementById("submissionsList");
    container.innerHTML = "";

    if (!Array.isArray(submissions) || submissions.length === 0) {
      container.innerHTML = '<p class="empty-message">📭 No team submissions yet.</p>';
      renderDashboard();
      return;
    }

    let validSubmissions = 0;
    let orphanedCount = 0;
    let rowsHTML = "";

    submissions.forEach(submission => {
      // Skip submissions where problem was deleted
      if (!submission.problem || !submission.problem[0]) {
        console.warn("⚠️ [Admin] Skipping orphaned submission:", submission.teamName);
        orphanedCount++;
        return;
      }

      validSubmissions++;
      const problemName = submission.problem[0].title;
      const submittedAt = new Date(submission.submittedAt).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      rowsHTML += `<tr>
        <td><strong>${submission.teamName}</strong></td>
        <td><span class="problem-badge">${problemName}</span></td>
        <td>${submittedAt}</td>
      </tr>`;
    });

    // Build complete HTML
    let tableHTML = `<table class="submissions-table">
      <thead>
        <tr>
          <th>👥 Team Name</th>
          <th>📄 Problem Statement</th>
          <th>📅 Submitted At</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHTML}
      </tbody>
    </table>
    <div class="submission-info">
      <p class="submission-summary">📊 Total Submissions: <strong>${validSubmissions}</strong></p>`;

    if (orphanedCount > 0) {
      tableHTML += `<p class="orphaned-warning">⚠️ ${orphanedCount} orphaned submission(s) found (problem was deleted)</p>`;
    }

    tableHTML += `</div>`;

    container.innerHTML = tableHTML;
    renderDashboard();

  } catch (error) {
    console.error("❌ [Admin] Error loading submissions:", error);
    document.getElementById("submissionsList").innerHTML = `<p class="error-message">Error loading submissions: ${error.message}</p>`;
    adminSubmissionsCache = [];
    renderDashboard();
  }
}

function refreshSubmissions() {
  console.log("🔄 [Admin] Refreshing submissions...");
  loadSubmissions();
}

// ==================== DELETE CONFIRMATION ====================

function closeDeleteModal() {
  console.log("❌ [Admin] Closing delete modal");
  document.getElementById("deleteModal").style.display = "none";
  problemToDelete = null;
}

async function confirmDelete() {
  if (!problemToDelete) {
    console.warn("⚠️ [Admin] No problem selected for deletion");
    return;
  }

  console.log("🗑️ [Admin] Deleting statement:", problemToDelete);

  try {
    const res = await fetch("/api/deketeHackathon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId: problemToDelete })
    });

    const data = await res.json();
    console.log("📊 [Admin] Response:", data);

    if (data.success) {
      console.log("✅ [Admin] Statement and related submissions deleted successfully");
      alert("✅ Problem statement and all team submissions deleted successfully!");
      closeDeleteModal();
      loadStatements();  // Refresh problem statements
      loadSubmissions(); // Refresh submissions table
    } else {
      console.warn("❌ [Admin] Delete failed");
      alert(data.message || "Failed to delete statement");
    }
  } catch (error) {
    console.error("❌ [Admin] Error:", error);
    alert("Error: " + error.message);
  }
}

// ==================== EDIT MANAGEMENT ====================

function openEditModal(statementId, title, maxTeams) {
  console.log("✏️ [Admin] Opening edit modal for statement:", statementId);

  problemToEdit = statementId;
  document.getElementById("editStatementTitle").value = title;
  document.getElementById("editStatementMaxTeams").value = maxTeams;
  document.getElementById("editModal").style.display = "block";
  document.getElementById("editStatementTitle").focus();
}

function closeEditModal() {
  console.log("❌ [Admin] Closing edit modal");
  document.getElementById("editModal").style.display = "none";
  problemToEdit = null;
}

async function confirmEdit() {
  if (!problemToEdit) {
    console.warn("⚠️ [Admin] No problem selected for editing");
    return;
  }

  const title = document.getElementById("editStatementTitle").value.trim();
  const maxTeams = document.getElementById("editStatementMaxTeams").value;

  if (!title || !maxTeams) {
    console.warn("⚠️ [Admin] Missing required fields");
    alert("Please fill in Title and Max Teams/Limit");
    return;
  }

  console.log("✏️ [Admin] Updating statement:", problemToEdit);
  console.log(`   Title: ${title}`);
  console.log(`   Max Teams: ${maxTeams}`);

  try {
    const res = await fetch("/api/updateProblem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: problemToEdit,
        title: title,
        maxTeams: parseInt(maxTeams)
      })
    });

    const data = await res.json();
    console.log("📊 [Admin] Response:", data);

    if (data.success) {
      console.log("✅ [Admin] Statement updated successfully");
      alert("✅ Problem statement updated successfully!");
      closeEditModal();
      loadStatements();  // Refresh problem statements
    } else {
      console.warn("❌ [Admin] Update failed");
      alert(data.message || "Failed to update statement");
    }
  } catch (error) {
    console.error("❌ [Admin] Error:", error);
    alert("Error: " + error.message);
  }
}

// ==================== PDF UPLOAD MANAGEMENT ====================
// PDF upload functionality has been removed. PDFs must be uploaded separately.

console.log("✅ [Admin] admin.js loaded and ready");

// ==================== REMOVE ALL TEAMS & SUBMISSIONS & PROBLEMS ====================

async function deleteAllTeamsAndSubmissions() {
  const confirmDelete = confirm(
    "⚠️ WARNING: This will DELETE ALL problem statements, team details, team names, and submission details from the database.\n\nThis action CANNOT be undone. Are you absolutely sure?"
  );

  if (!confirmDelete) {
    console.log("❌ [Admin] Delete all operation cancelled");
    return;
  }

  const finalConfirm = confirm(
    "🔴 LAST CHANCE: Confirm deletion of ALL problems, teams and submissions?\n\nClick 'OK' to proceed or 'Cancel' to abort."
  );

  if (!finalConfirm) {
    console.log("❌ [Admin] Delete all operation cancelled");
    return;
  }

  console.log("🗑️ [Admin] Deleting ALL problems, teams and submissions...");

  try {
    // Get all problems first
    const problemsRes = await fetch("/api/getProblems");
    if (!problemsRes.ok) throw new Error("Failed to fetch problems");

    const problems = await problemsRes.json();
    console.log(`✅ [Admin] Found ${problems.length} problems to delete`);

    // Delete each problem (which will cascade delete submissions)
    for (let problem of problems) {
      const deleteRes = await fetch("/api/deketeHackathon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem._id })
      });

      const deleteData = await deleteRes.json();
      console.log(`✅ [Admin] Deleted problem: ${problem.title}`);
    }

    console.log("✅ [Admin] All problems, teams and submissions deleted successfully");
    alert("✅ All problem statements, team details and submissions have been successfully deleted!");
    loadStatements();  // Refresh problem statements
    loadSubmissions(); // Refresh submissions table
  } catch (error) {
    console.error("❌ [Admin] Error:", error);
    alert("Error: " + error.message);
  }
}

// ==================== RESET LOGIN CREDENTIAL MAPPINGS ====================

async function resetLoginCredentials() {
  const confirmed = confirm(
    "⚠️ This will reset all existing login-credential mappings for participants.\n\nAfter this, users can login with the same credentials and they will see all problems again until they select/submit.\n\nDo you want to continue?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const res = await fetch("/api/resetLoginCredentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to reset login credentials");
    }

    alert("✅ Login credentials reset applied successfully.");
  } catch (error) {
    alert("❌ " + error.message);
  }
}

// ==================== UPLOAD FROM DRIVE LINK ====================

async function uploadFromDriveLink() {
  console.log("☁️ [Admin] Opening drive link upload dialog...");

  const driveLink = prompt(
    "📎 Enter Google Drive Link:\n\nExample: https://drive.google.com/file/d/FILE_ID/view\n\nOr paste the sharing link:"
  );

  if (!driveLink) {
    console.log("❌ [Admin] Drive link upload cancelled");
    return;
  }

  if (!driveLink.trim()) {
    alert("Please enter a valid Google Drive link");
    return;
  }

  console.log("📤 [Admin] Uploading from drive link...");
  console.log(`   Drive Link: ${driveLink}`);

  try {
    const res = await fetch("/api/uploadProblem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driveLink: driveLink.trim(),
        uploadType: "drive_link"
      })
    });

    const data = await res.json();
    console.log("📊 [Admin] Response:", data);

    if (res.ok && data.success) {
      console.log("✅ [Admin] File uploaded successfully from drive");
      alert("✅ File uploaded successfully from Google Drive!");
      loadStatements();
    } else {
      console.warn("❌ [Admin] Upload failed");
      alert(data.message || "Failed to upload file from drive link");
    }
  } catch (error) {
    console.error("❌ [Admin] Upload error:", error);
    alert("Error: " + error.message);
  }
}

// ==================== DELETE UPLOADED FILE ====================

async function deleteUploadedFile() {
  const confirmDelete = confirm(
    "⚠️ Are you sure you want to delete the uploaded file link?\n\nThis will remove the file from the system."
  );

  if (!confirmDelete) {
    console.log("❌ [Admin] Delete file operation cancelled");
    return;
  }

  console.log("🗑️ [Admin] Deleting uploaded file...");

  try {
    // Get all problems and clear the pdfUrl from the first one with a file
    const res = await fetch("/api/getProblems");
    if (!res.ok) throw new Error("Failed to fetch problems");

    const problems = await res.json();
    
    // Find first problem with uploaded file
    let problemWithFile = null;
    for (let problem of problems) {
      if (problem.pdfUrl && problem.pdfUrl.trim() !== "") {
        problemWithFile = problem;
        break;
      }
    }

    if (!problemWithFile) {
      alert("⚠️ No file is currently uploaded.");
      return;
    }

    // Delete the file by updating the problem with null pdfUrl
    const updateRes = await fetch("/api/updateProblem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: problemWithFile._id,
        pdfUrl: null
      })
    });

    const updateData = await updateRes.json();
    console.log("📊 [Admin] Response:", updateData);

    if (updateData.success) {
      console.log("✅ [Admin] File deleted successfully");
      alert("✅ Uploaded file has been deleted successfully!");
      loadStatements();  // Refresh to show updated state
    } else {
      console.warn("❌ [Admin] Delete failed");
      alert(updateData.message || "Failed to delete file");
    }
  } catch (error) {
    console.error("❌ [Admin] Error:", error);
    alert("Error: " + error.message);
  }
}

// ==================== CHANGE PASSWORD ====================

function openChangePasswordModal() {
  console.log("🔐 [Admin] Opening change password modal...");
  document.getElementById("changePasswordModal").style.display = "block";
  
  // Clear previous values and messages
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  document.getElementById("passwordMessage").style.display = "none";
  document.getElementById("passwordMessage").textContent = "";
}

function closeChangePasswordModal() {
  console.log("🔐 [Admin] Closing change password modal...");
  document.getElementById("changePasswordModal").style.display = "none";
  
  // Clear all inputs
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  document.getElementById("passwordMessage").style.display = "none";
  document.getElementById("passwordMessage").textContent = "";
}

async function confirmPasswordChange() {
  const currentPassword = document.getElementById("currentPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const messageElement = document.getElementById("passwordMessage");

  console.log("🔐 [Admin] Validating password change...");

  // Validation
  if (!currentPassword) {
    messageElement.textContent = "❌ Please enter current password";
    messageElement.style.display = "block";
    return;
  }

  if (!newPassword) {
    messageElement.textContent = "❌ Please enter new password";
    messageElement.style.display = "block";
    return;
  }

  if (!confirmPassword) {
    messageElement.textContent = "❌ Please confirm new password";
    messageElement.style.display = "block";
    return;
  }

  if (newPassword !== confirmPassword) {
    messageElement.textContent = "❌ New passwords do not match. Please confirm correctly.";
    messageElement.style.display = "block";
    return;
  }

  if (newPassword.length < 6) {
    messageElement.textContent = "❌ New password must be at least 6 characters long";
    messageElement.style.display = "block";
    return;
  }

  console.log("📤 [Admin] Sending password change request...");

  try {
    const res = await fetch("/api/changePassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: newPassword
      })
    });

    const data = await res.json();
    console.log("📊 [Admin] Response:", data);

    if (res.ok && data.success) {
      console.log("✅ [Admin] Password changed successfully");
      alert("✅ Password changed successfully!\n\nPlease login again with your new password.");
      closeChangePasswordModal();
      adminLogout();  // Log out user so they login with new password
    } else {
      console.warn("❌ [Admin] Password change failed");
      messageElement.textContent = "❌ " + (data.message || "Failed to change password");
      messageElement.style.display = "block";
    }
  } catch (error) {
    console.error("❌ [Admin] Password change error:", error);
    messageElement.textContent = "❌ Error: " + error.message;
    messageElement.style.display = "block";
  }
}