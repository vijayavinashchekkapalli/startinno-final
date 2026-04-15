let authToken = null;
let adminEmail = null;
let problemToDelete = null;
let problemToEdit = null;

// ==================== AUTHENTICATION ====================

async function adminLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  console.log("🔐 [Admin] Attempting login...");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("📊 [Admin] Login response:", data);

    if (data.success) {
      console.log("✅ [Admin] Login successful");
      authToken = data.token;
      adminEmail = data.email;

      // Save to localStorage
      localStorage.setItem("adminToken", authToken);
      localStorage.setItem("adminEmail", adminEmail);

      // Show admin panel
      document.getElementById("loginContainer").style.display = "none";
      document.getElementById("adminContainer").style.display = "block";
      document.getElementById("adminEmail").textContent = adminEmail;

      // Load data
      loadStatements();
      loadSubmissions();
    } else {
      console.warn("❌ [Admin] Login failed:");
      alert(data.message || "Login failed");
    }
  } catch (error) {
    console.error("❌ [Admin] Login error:", error);
    alert("Error: " + error.message);
  }
}

function adminLogout() {
  console.log("🚪 [Admin] Logging out...");
  authToken = null;
  adminEmail = null;
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminEmail");

  document.getElementById("loginContainer").style.display = "block";
  document.getElementById("adminContainer").style.display = "none";
  document.getElementById("loginEmail").value = "admin@startinno.com";
  document.getElementById("loginPassword").value = "admin123";
}

// ==================== CHECK AUTH ON LOAD ====================

window.onload = function() {
  console.log("✅ [Admin] Page loaded");
  const savedToken = localStorage.getItem("adminToken");
  
  if (savedToken) {
    authToken = savedToken;
    adminEmail = localStorage.getItem("adminEmail");
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("adminContainer").style.display = "block";
    document.getElementById("adminEmail").textContent = adminEmail;

    console.log("✅ [Admin] Restored session for:", adminEmail);
    loadStatements();
    loadSubmissions();
  } else {
    console.log("ℹ️ [Admin] No saved session");
  }
};

// ==================== STATEMENTS MANAGEMENT ====================

async function loadStatements() {
  console.log("📥 [Admin] Loading problem statements...");

  try {
    const res = await fetch("/api/getProblems");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const problems = await res.json();
    console.log("✅ [Admin] Loaded statements:", problems);

    const container = document.getElementById("statementsList");
    container.innerHTML = "";

    if (!Array.isArray(problems) || problems.length === 0) {
      container.innerHTML = '<p class="empty-message">No problem statements added yet. Click "Add Problem Statement" to create one.</p>';
      return;
    }

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
          <button onclick="openEditModal('${statement._id}', '${statement.title.replace(/'/g, "\\'")}}', ${statement.maxTeams})" class="btn-warning">✏️ Edit</button>
          <button onclick="deleteStatement('${statement._id}', '${statement.title.replace(/'/g, "\\'")}')" class="btn-danger">🗑️ Delete</button>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (error) {
    console.error("❌ [Admin] Error loading statements:", error);
    document.getElementById("statementsList").innerHTML = `<p class="error-message">Error loading statements: ${error.message}</p>`;
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
    console.log("✅ [Admin] Loaded submissions:", submissions);

    const container = document.getElementById("submissionsList");
    container.innerHTML = "";

    if (!Array.isArray(submissions) || submissions.length === 0) {
      container.innerHTML = '<p class="empty-message">📭 No team submissions yet.</p>';
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

  } catch (error) {
    console.error("❌ [Admin] Error loading submissions:", error);
    document.getElementById("submissionsList").innerHTML = `<p class="error-message">Error loading submissions: ${error.message}</p>`;
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