// ==================== AUTHENTICATION ====================

let authToken = null;
let participantUsername = null;
let currentRole = "participant"; // Default role
const INVALID_LOGIN_MESSAGE = "Enter valid details";

const PARTICIPANT_SELECTION_SCOPE_KEY = "participantSelectionScope";
let participantSelectionScope = null;

function setParticipantSelectionScope(scope) {
  participantSelectionScope = scope || null;

  if (participantSelectionScope) {
    localStorage.setItem(PARTICIPANT_SELECTION_SCOPE_KEY, participantSelectionScope);
  } else {
    localStorage.removeItem(PARTICIPANT_SELECTION_SCOPE_KEY);
  }
}

function buildParticipantSelectionScope(username, password) {
  return btoa(`${String(username || "guest")}:${String(password || "")}`);
}
const CREDENTIALS_RESET_VERSION_KEY = "credentialsResetVersion";
let credentialsResetVersion = "1";


function getSubmittedProblemStorageKeyForUsername(username) {
  const scope = participantSelectionScope || localStorage.getItem(PARTICIPANT_SELECTION_SCOPE_KEY);
  return `submittedProblemId_${scope || username || "guest"}_v${credentialsResetVersion}`;
}

function getSubmittedTeamStorageKeyForUsername(username) {
  const scope = participantSelectionScope || localStorage.getItem(PARTICIPANT_SELECTION_SCOPE_KEY);
  return `submittedTeamName_${scope || username || "guest"}_v${credentialsResetVersion}`;
}

function clearParticipantSessionStorage(options = {}) {
  const { preserveSelection = false } = options;
  const activeUsername = participantUsername || localStorage.getItem("participantUsername");

  localStorage.removeItem("authToken");
  localStorage.removeItem("participantUsername");
  localStorage.removeItem("participantUserId");

  if (!preserveSelection) {
    localStorage.removeItem(getSubmittedProblemStorageKeyForUsername(activeUsername));
    localStorage.removeItem(getSubmittedTeamStorageKeyForUsername(activeUsername));
    localStorage.removeItem(CREDENTIALS_RESET_VERSION_KEY);
    credentialsResetVersion = "1";
    setParticipantSelectionScope(null);
  }

  localStorage.removeItem("userRole");
}

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

async function validateStoredSession(savedToken, savedRole) {
  const decoded = decodeSessionToken(savedToken);

  if (!decoded || decoded.role !== savedRole) {
    return { valid: false };
  }

  const requestBody = savedRole === "participant"
    ? { username: decoded.identifier, password: decoded.password, role: "participant" }
    : { email: decoded.identifier, password: decoded.password, role: "admin" };

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
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

async function ensureActiveParticipantSession() {
  if (!authToken || !participantUsername) {
    return false;
  }

  const validation = await validateStoredSession(authToken, "participant");
  if (validation.valid) {
    authToken = validation.data.token;
    participantUsername = validation.data.username;
    credentialsResetVersion = String(validation.data.credentialsResetVersion || localStorage.getItem(CREDENTIALS_RESET_VERSION_KEY) || "1");

    const decoded = decodeSessionToken(authToken);
    if (decoded && decoded.role === "participant") {
      setParticipantSelectionScope(buildParticipantSelectionScope(decoded.identifier, decoded.password));
    }

    localStorage.setItem(CREDENTIALS_RESET_VERSION_KEY, credentialsResetVersion);
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("participantUsername", participantUsername);
    localStorage.setItem("participantUserId", String(validation.data.userId || ""));
    return true;
  }

  participantLogout();
  showParticipantLoginError(INVALID_LOGIN_MESSAGE);
  return false;
}

async function participantLoginFromHome(triggerEvent) {
  const username = document.getElementById("participantUsername").value.trim();
  const password = document.getElementById("participantPassword").value.trim();
  const loginBtn = (triggerEvent && triggerEvent.target) || document.getElementById("participantLoginBtn");

  if (!username || !password) {
    showParticipantLoginError("Please enter username and password");
    return;
  }

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.dataset.originalText = loginBtn.textContent;
    loginBtn.textContent = "🔄 Logging in...";
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

    if (!res.ok || !data.success) {
      clearParticipantSessionStorage({ preserveSelection: true });
      showParticipantLoginError(INVALID_LOGIN_MESSAGE);
      return;
    }

    const currentUserId = String(data.userId || "");
    credentialsResetVersion = String(data.credentialsResetVersion || "1");

    authToken = data.token;
    participantUsername = data.username;
    setParticipantSelectionScope(buildParticipantSelectionScope(username, password));

    localStorage.setItem(CREDENTIALS_RESET_VERSION_KEY, credentialsResetVersion);
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("participantUsername", participantUsername);
    localStorage.setItem("participantUserId", currentUserId);
    localStorage.setItem("userRole", "participant");

    hideParticipantLogin();
    showMainContent();
    startAutoRefresh();
    loadProblems();
  } catch (error) {
    console.error("❌ [Participant] Login error:", error);
    clearParticipantSessionStorage({ preserveSelection: true });
    showParticipantLoginError(INVALID_LOGIN_MESSAGE);
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = loginBtn.dataset.originalText || "Login as Participant";
      delete loginBtn.dataset.originalText;
    }
  }
}

// ==================== ADMIN LOGIN FROM HOME PAGE ====================

async function participantAdminLogin(triggerEvent) {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();
  const loginBtn = (triggerEvent && triggerEvent.target) || document.getElementById("adminLoginBtn");

  if (!email || !password) {
    showParticipantLoginError("Please enter email and password");
    return;
  }

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.dataset.originalText = loginBtn.textContent;
    loginBtn.textContent = "🔄 Logging in...";
  }

  console.log("🔐 [Admin] Attempting login from home...");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "admin" })
    });

    const data = await res.json();
    console.log("📊 [Admin] Login response:", data);

    if (!res.ok || !data.success) {
      clearAdminSessionStorage();
      showParticipantLoginError(INVALID_LOGIN_MESSAGE);
      return;
    }

    authToken = data.token;
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("adminEmail", email);
    localStorage.setItem("userRole", "admin");

    window.location.href = "/admin.html";
  } catch (error) {
    console.error("❌ [Admin] Login error:", error);
    clearAdminSessionStorage();
    showParticipantLoginError(INVALID_LOGIN_MESSAGE);
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = loginBtn.dataset.originalText || "Login as Admin";
      delete loginBtn.dataset.originalText;
    }
  }
}

// ==================== ROLE SELECTION ====================

function selectRole(role) {
  currentRole = role;
  
  // Update role button styles
  const participantBtn = document.getElementById("participantRoleBtn");
  const adminBtn = document.getElementById("adminRoleBtn");
  
  if (role === "participant") {
    participantBtn.classList.add("active");
    adminBtn.classList.remove("active");
    document.getElementById("participantLoginForm").style.display = "block";
    document.getElementById("adminConfirmation").style.display = "none";
    document.getElementById("adminLoginForm").style.display = "none";
  } else if (role === "admin") {
    participantBtn.classList.remove("active");
    adminBtn.classList.add("active");
    document.getElementById("participantLoginForm").style.display = "none";
    document.getElementById("adminConfirmation").style.display = "block";
    document.getElementById("adminLoginForm").style.display = "none";
  }
  
  // Clear error message
  hideParticipantLoginError();
  
  // Clear previous form values
  document.getElementById("participantUsername").value = "";
  document.getElementById("participantPassword").value = "";
  document.getElementById("adminEmail").value = "";
  document.getElementById("adminPassword").value = "";
  
  console.log(`✅ [Auth] Switched to ${role} login`);
}

// ==================== ADMIN CONFIRMATION ====================

function proceedToAdminLogin() {
  // Hide confirmation, show login form
  document.getElementById("adminConfirmation").style.display = "none";
  document.getElementById("adminLoginForm").style.display = "block";
  console.log("🔐 [Admin] Proceeding to login form");
  // Focus on email input
  setTimeout(() => document.getElementById("adminEmail").focus(), 100);
}

function goBackToRoleSelection() {
  // Go back to role selection
  selectRole("participant");
  console.log("↩️ [Admin] Going back to role selection");
}

function participantLogout() {
  console.log("🚪 [Participant] Logging out...");

  // Clear auth session but keep selected problem lock for same user re-login.
  clearParticipantSessionStorage({ preserveSelection: true });

  authToken = null;
  currentRole = "participant";
  clearInterval(autoRefreshInterval);
  participantUsername = null;

  // Show login form
  showParticipantLogin();
  hideMainContent();

  document.getElementById("participantUsername").value = "";
  document.getElementById("participantPassword").value = "";
  document.getElementById("adminEmail").value = "";
  document.getElementById("adminPassword").value = "";
  hideParticipantLoginError();
  selectRole("participant"); // Reset to participant role
}

function showParticipantLogin() {
  document.getElementById("participantLoginContainer").style.display = "flex";
}

function hideParticipantLogin() {
  document.getElementById("participantLoginContainer").style.display = "none";
}

function showMainContent() {
  document.getElementById("mainHeader").style.display = "block";
  document.getElementById("mainContent").style.display = "block";
  document.getElementById("problems").innerHTML = `<p class="loading">Loading problems...</p>`;
}

function hideMainContent() {
  document.getElementById("mainHeader").style.display = "none";
  document.getElementById("mainContent").style.display = "none";
}

function showParticipantLoginError(message) {
  const errorDiv = document.getElementById("participantLoginError");
  errorDiv.textContent = message;
  errorDiv.style.background = "#ffe5e5";
  errorDiv.style.color = "#b00020";
  errorDiv.style.fontWeight = "800";
  errorDiv.style.fontSize = "1rem";
  errorDiv.style.borderLeft = "6px solid #b00020";
  errorDiv.style.padding = "12px";
  errorDiv.style.borderRadius = "5px";
  errorDiv.style.marginTop = "15px";
  errorDiv.style.display = "block";
  errorDiv.style.visibility = "visible";
  errorDiv.style.opacity = "1";
  errorDiv.classList.add("show");
  clearTimeout(window.participantLoginErrorTimer);
  window.participantLoginErrorTimer = setTimeout(() => {
    errorDiv.classList.remove("show");
    errorDiv.style.display = "none";
  }, 5000);
}

function hideParticipantLoginError() {
  const errorDiv = document.getElementById("participantLoginError");
  errorDiv.classList.remove("show");
  errorDiv.style.display = "none";
}

// ==================== CHECK AUTH ON LOAD ====================

window.addEventListener("DOMContentLoaded", async function() {
  console.log("✅ [Participant] Page loaded");
  const participantLoginBtn = document.getElementById("participantLoginBtn");
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  const participantUsernameInput = document.getElementById("participantUsername");
  const participantPasswordInput = document.getElementById("participantPassword");
  const adminEmailInput = document.getElementById("adminEmail");
  const adminPasswordInput = document.getElementById("adminPassword");
  const attendanceRoomBtn = document.getElementById("attendanceRoomBtn");

  const persistedScope = localStorage.getItem(PARTICIPANT_SELECTION_SCOPE_KEY);
  if (persistedScope) {
    participantSelectionScope = persistedScope;
  }

  if (attendanceRoomBtn) {
    attendanceRoomBtn.style.display = "none";
  }

  if (participantLoginBtn) {
    participantLoginBtn.addEventListener("click", participantLoginFromHome);
  }

  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", participantAdminLogin);
  }

  [participantUsernameInput, participantPasswordInput].forEach((input) => {
    if (input) {
      input.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
          participantLoginFromHome();
        }
      });
    }
  });

  [adminEmailInput, adminPasswordInput].forEach((input) => {
    if (input) {
      input.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
          participantAdminLogin();
        }
      });
    }
  });
  const savedToken = localStorage.getItem("authToken");
  const savedRole = localStorage.getItem("userRole");
  
  if (savedToken && savedRole === "participant") {
    const validation = await validateStoredSession(savedToken, "participant");

    if (validation.valid) {
      authToken = validation.data.token;
      participantUsername = validation.data.username;
      credentialsResetVersion = String(validation.data.credentialsResetVersion || localStorage.getItem(CREDENTIALS_RESET_VERSION_KEY) || "1");

      const decoded = decodeSessionToken(authToken);
      if (decoded && decoded.role === "participant") {
        setParticipantSelectionScope(buildParticipantSelectionScope(decoded.identifier, decoded.password));
      }

      localStorage.setItem(CREDENTIALS_RESET_VERSION_KEY, credentialsResetVersion);
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("participantUsername", participantUsername);
      localStorage.setItem("participantUserId", String(validation.data.userId || ""));
      localStorage.setItem("userRole", "participant");

      console.log("✅ [Participant] Restored session for:", participantUsername);
      hideParticipantLogin();
      showMainContent();
      loadProblems();
      startAutoRefresh();
    } else {
      clearParticipantSessionStorage({ preserveSelection: true });
      console.warn("⚠️ [Participant] Saved session is invalid");
      showParticipantLogin();
      hideMainContent();
      showParticipantLoginError(INVALID_LOGIN_MESSAGE);
    }
  } else if (savedToken && savedRole === "admin") {
    const validation = await validateStoredSession(savedToken, "admin");

    if (validation.valid) {
      localStorage.setItem("authToken", validation.data.token);
      localStorage.setItem("adminEmail", validation.data.email || localStorage.getItem("adminEmail") || "");
      localStorage.setItem("userRole", "admin");
      window.location.href = "/admin.html";
    } else {
      clearAdminSessionStorage();
      console.warn("⚠️ [Admin] Saved session is invalid");
      showParticipantLogin();
      hideMainContent();
      showParticipantLoginError(INVALID_LOGIN_MESSAGE);
    }
  } else {
    console.log("ℹ️ [Participant] No saved session");
    showParticipantLogin();
    hideMainContent();
  }
});

// ==================== PAGE INITIALIZATION ====================

const teamNames = {};
let selectedProblemId = null;
let allProblems = [];
let autoRefreshInterval = null;

function getSubmittedProblemStorageKey() {
  return getSubmittedProblemStorageKeyForUsername(participantUsername);
}

function getSubmittedTeamStorageKey() {
  return getSubmittedTeamStorageKeyForUsername(participantUsername);
}

function getSubmittedProblemId() {
  return localStorage.getItem(getSubmittedProblemStorageKey());
}

function setSubmittedProblemId(problemId) {
  localStorage.setItem(getSubmittedProblemStorageKey(), problemId);
}

function getSubmittedTeamName() {
  return localStorage.getItem(getSubmittedTeamStorageKey());
}

function setSubmittedTeamName(teamName) {
  localStorage.setItem(getSubmittedTeamStorageKey(), teamName);
}

function clearSubmittedProblemId() {
  localStorage.removeItem(getSubmittedProblemStorageKey());
}

function clearSubmittedTeamName() {
  localStorage.removeItem(getSubmittedTeamStorageKey());
}

function clearStoredSubmissionLock() {
  clearSubmittedProblemId();
  clearSubmittedTeamName();
}

function getSubmissionProblemIdFromRecord(submission) {
  if (submission?.problemId) {
    return String(submission.problemId);
  }

  if (Array.isArray(submission?.problem) && submission.problem[0]?._id) {
    return String(submission.problem[0]._id);
  }

  return null;
}

async function syncSubmissionLockWithDatabase(storedProblemId) {
  // Preserve participant lock state even if records are modified directly in MongoDB.
  return storedProblemId || null;
}

function startAutoRefresh() {
  // Auto-refresh every 15 seconds to sync with admin changes
  autoRefreshInterval = setInterval(() => {
    loadProblems();
  }, 15000);
}

// ==================== LOAD PROBLEMS ====================

async function loadProblems() {
  const container = document.getElementById("problems");

  const isSessionValid = await ensureActiveParticipantSession();
  if (!isSessionValid) {
    return;
  }
  
  try {
    const res = await fetch("/api/getProblems?t=" + Date.now()); // Bypass cache
    
    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }

    const data = await res.json();
    allProblems = data || [];

    let problemsToRender = Array.isArray(data) ? [...data] : [];
    let submittedProblemId = getSubmittedProblemId();
    submittedProblemId = await syncSubmissionLockWithDatabase(submittedProblemId);

    // If this participant already submitted, only show their selected problem.
    if (submittedProblemId) {
      const submittedProblem = problemsToRender.find((problem) => problem._id === submittedProblemId);

      if (submittedProblem) {
        problemsToRender = [submittedProblem];
      } else {
        // Keep lock behavior strict: never fall back to all problems for locked users.
        problemsToRender = [];
      }
    }

    container.innerHTML = "";

    // Check if data is an array and has items
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h2>📭 No Problems Available</h2>
          <p>The hackathon problems will be available soon.</p>
          <p>Please ask the admin to add problems.</p>
          <button onclick="location.reload()" class="btn-secondary">Refresh Page</button>
        </div>
      `;
      return;
    }

    // Render problem cards
    if (problemsToRender.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h2>📭 No Problems Available</h2>
          <p>The selected problem is no longer available.</p>
          <button onclick="location.reload()" class="btn-secondary">Refresh Page</button>
        </div>
      `;
      return;
    }

    problemsToRender.forEach((p, index) => {
      const isFull = p.selectedTeams >= p.maxTeams;
      const isSelected = teamNames[p._id] ? true : false;
      const hasSubmittedProblem = Boolean(submittedProblemId);
      const isLockedForUser = hasSubmittedProblem;

      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <div class="card-header">
          <h2>Problem ${index + 1}</h2>
          <span class="status-badge ${isFull ? 'full' : 'available'}">
            ${isFull ? 'FULL' : 'OPEN'}
          </span>
        </div>
        
        <div class="card-content">
          <p class="problem-title">${p.title}</p>
          <p class="team-count">Teams: ${p.selectedTeams}/${p.maxTeams}</p>
        </div>
        
        <div class="card-footer">
          <div class="selection-area">
            <button 
              class="problem-circle ${isSelected ? 'selected' : ''} ${isFull || isLockedForUser ? 'disabled' : ''}"
              onclick="openTeamNameModal('${p._id}')" 
              ${isFull || isLockedForUser ? 'disabled' : ''}
              title="${hasSubmittedProblem ? 'Team details are locked after submission' : (isSelected ? 'Team: ' + teamNames[p._id] : 'Click to select this problem')}"
            >
              ${isSelected ? '✓' : '◯'}
            </button>
            ${isSelected ? `<p class="selected-team">Team: ${teamNames[p._id]}</p>` : ''}
          </div>
          <button 
            class="btn-submit ${!isSelected || isFull || isLockedForUser ? 'disabled' : ''}"
            onclick="submit('${p._id}')" 
            ${!isSelected || isFull || isLockedForUser ? 'disabled' : ''}
          >
            ${isLockedForUser ? '✅ Submitted' : (isFull ? '🔒 FULL' : isSelected ? 'Submit Team' : 'Select')}
          </button>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (error) {
    container.innerHTML = `
      <div class="error-state">
        <h2>⚠️  Error Loading Problems</h2>
        <p><strong>Error:</strong> ${error.message}</p>
        <button onclick="location.reload()" class="btn-secondary">Retry</button>
      </div>
    `;
  }
}

function openTeamNameModal(problemId) {
  // Once a team submits, lock team-name edits for that account.
  if (getSubmittedProblemId()) {
    alert("✅ You have already submitted. Team details are locked.");
    return;
  }

  selectedProblemId = problemId;
  const currentName = teamNames[problemId] || "";
  
  document.getElementById("teamNameInput").value = currentName;
  document.getElementById("teamNameModal").style.display = "block";
  document.getElementById("teamNameInput").focus();
}

function closeTeamNameModal() {
  document.getElementById("teamNameModal").style.display = "none";
  selectedProblemId = null;
}

function confirmTeamName() {
  const teamName = document.getElementById("teamNameInput").value.trim();
  
  if (!teamName) {
    alert("⚠️ Please enter your team name");
    return;
  }

  if (!selectedProblemId) {
    return;
  }

  teamNames[selectedProblemId] = teamName;
  closeTeamNameModal();
  loadProblems();
}

async function submit(problemId) {
  const teamName = teamNames[problemId];
  
  if (!teamName) {
    alert("⚠️ Please select a problem and enter your team name");
    return;
  }

  const button = event.target;
  const originalText = button.textContent;
  button.textContent = "✓ Submitting...";
  button.disabled = true;

  try {
    const res = await fetch("/api/submitTeam", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ teamName, problemId })
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Team submitted successfully!");
      setSubmittedProblemId(problemId);
      setSubmittedTeamName(teamName);
      delete teamNames[problemId];
      loadProblems();
    } else {
      alert("⚠️ " + (data.message || "Submission failed"));
      button.textContent = originalText;
      button.disabled = false;
    }
  } catch (error) {
    alert("❌ Error: " + error.message);
    button.textContent = originalText;
    button.disabled = false;
  }
}

// ==================== PROBLEM STATEMENT DETAILS MODAL ====================

function openStatementDetailsModal(problemId) {
  const problem = allProblems.find(p => p._id === problemId);
  
  if (!problem) {
    alert("Problem not found");
    return;
  }

  const content = document.getElementById("statementDetailsContent");
  
  if (!problem.pdfUrl) {
    content.innerHTML = `
      <div class="statement-details-empty">
        <p>❌ PDF not yet uploaded by admin</p>
        <p class="details-meta">Problem: ${problem.title}</p>
      </div>
    `;
  } else {
    let pdfPreviewUrl = problem.pdfUrl;
    if (problem.pdfUrl.includes("drive.google.com")) {
      const fileId = problem.pdfUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileId && fileId[1]) {
        pdfPreviewUrl = `https://drive.google.com/file/d/${fileId[1]}/preview`;
      }
    }

    content.innerHTML = `
      <div class="statement-details-container">
        <div class="details-header">
          <h3>Problem Statement Details</h3>
          <p class="details-meta">${problem.title}</p>
          <p class="details-meta-small">Teams Registered: ${problem.selectedTeams || 0} / ${problem.maxTeams}</p>
        </div>
        
        <div class="pdf-viewer">
          <iframe 
            src="${pdfPreviewUrl}" 
            style="width: 100%; height: 700px; border: none; border-radius: 8px;"
            title="Problem PDF"
            allow="autoplay"
          ></iframe>
        </div>
        
        <div class="details-actions">
          <a href="${problem.pdfUrl}" target="_blank" class="btn-primary">📥 Download PDF</a>
        </div>
      </div>
    `;
  }
  
  document.getElementById("statementDetailsModal").style.display = "block";
  
  // Add scroll event listener to show/hide sticky footer button
  setTimeout(() => {
    const modal = document.querySelector('.modal-content.modal-large');
    if (modal) {
      modal.addEventListener('scroll', handleModalScroll);
    }
  }, 100);
}

function handleModalScroll() {
  const modal = document.querySelector('.modal-content.modal-large');
  const stickyBtn = document.getElementById("stickyFooterBtn");
  
  if (modal && stickyBtn) {
    // Show sticky footer if scrolled down more than 300px
    if (modal.scrollTop > 300) {
      stickyBtn.style.display = "block";
    } else {
      stickyBtn.style.display = "none";
    }
  }
}

function closeStatementDetailsModal() {
  document.getElementById("statementDetailsModal").style.display = "none";
  
  // Hide sticky footer button
  const stickyBtn = document.getElementById("stickyFooterBtn");
  if (stickyBtn) {
    stickyBtn.style.display = "none";
  }
  
  // Remove scroll event listener
  const modal = document.querySelector('.modal-content.modal-large');
  if (modal) {
    modal.removeEventListener('scroll', handleModalScroll);
  }
}

// ==================== CLICK HANDLERS ====================

// PDF view modal events removed - users click Select button to choose problem

// ==================== VIEW UPLOADED FILES ====================

async function viewUploadedFiles() {
  console.log("👁️ [User] Opening view uploaded files modal...");
  
  const modal = document.getElementById("viewFilesModal");
  const content = document.getElementById("uploadedFilesContent");
  
  modal.style.display = "block";
  content.innerHTML = '<p class="loading">Loading file...</p>';
  
  try {
    const res = await fetch("/api/getProblems?t=" + Date.now());
    
    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }

    const problems = await res.json();
    console.log("✅ [User] Loaded problems:", problems);

    if (!Array.isArray(problems) || problems.length === 0) {
      content.innerHTML = `
        <div class="empty-files-state">
          <h3>📭 No Files Available</h3>
          <p>No problem statement files have been uploaded yet by the admin.</p>
        </div>
      `;
      return;
    }

    // Find the first problem with an uploaded file
    let uploadedFile = null;
    for (let problem of problems) {
      if (problem.pdfUrl && problem.pdfUrl.trim() !== "") {
        uploadedFile = problem;
        break;
      }
    }

    if (!uploadedFile) {
      content.innerHTML = `
        <div class="empty-files-state">
          <h3>❌ No File Uploaded Yet</h3>
          <p>The admin has not uploaded any problem statement file yet.</p>
          <p style="margin-top: 15px; color: #a0a0a0; font-size: 0.9em;">Please check back later.</p>
        </div>
      `;
      return;
    }

    // Extract file ID from Google Drive URL
    let pdfPreviewUrl = uploadedFile.pdfUrl;
    if (uploadedFile.pdfUrl.includes("drive.google.com")) {
      const fileId = uploadedFile.pdfUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileId && fileId[1]) {
        pdfPreviewUrl = `https://drive.google.com/file/d/${fileId[1]}/preview`;
      }
    }

    let filesHTML = `
      <div class="single-file-container">
        <div class="file-card-large">
          <div class="file-header-large">
            <h3>📄 Problem Statement</h3>
            <span class="total-problems-badge">Total Problems: ${problems.length}</span>
          </div>
          
          <div class="file-preview-large">
            <iframe 
              src="${pdfPreviewUrl}" 
              style="width: 100%; height: 600px; border: none; border-radius: 8px; background: #f5f5f5;"
              title="Problem Statement Preview"
              allow="autoplay"
            ></iframe>
          </div>
          
          <div class="file-actions-large">
            <a href="${uploadedFile.pdfUrl}" target="_blank" class="btn-download-large">📥 Download File</a>
            <button onclick="viewFileFullScreen('${pdfPreviewUrl}')" class="btn-fullscreen-large">🖥️ Full Screen</button>
          </div>
          
          <div class="file-info">
            <p>✅ This is the main problem statement file used for all ${problems.length} problems in the hackathon.</p>
          </div>
        </div>
      </div>
    `;

    content.innerHTML = filesHTML;
    
    // Add scroll event listener to show/hide sticky footer button
    setTimeout(() => {
      const modal = document.querySelector('#viewFilesModal .modal-content.modal-large');
      if (modal) {
        modal.addEventListener('scroll', handleViewFilesScroll);
      }
    }, 100);

  } catch (error) {
    console.error("❌ [User] Error loading files:", error);
    content.innerHTML = `
      <div class="error-files-state">
        <h3>⚠️ Error Loading File</h3>
        <p>${error.message}</p>
        <button onclick="viewUploadedFiles()" class="btn-retry">🔄 Retry</button>
      </div>
    `;
  }
}

function closeViewFilesModal() {
  console.log("❌ [User] Closing view files modal");
  document.getElementById("viewFilesModal").style.display = "none";
  
  // Hide sticky footer button
  const stickyBtn = document.getElementById("viewFilesFooterBtn");
  if (stickyBtn) {
    stickyBtn.style.display = "none";
  }
  
  // Remove scroll event listener
  const modal = document.querySelector('#viewFilesModal .modal-content.modal-large');
  if (modal) {
    modal.removeEventListener('scroll', handleViewFilesScroll);
  }
}

function handleViewFilesScroll() {
  const modal = document.querySelector('#viewFilesModal .modal-content.modal-large');
  const stickyBtn = document.getElementById("viewFilesFooterBtn");
  
  if (modal && stickyBtn) {
    // Show sticky footer if scrolled down more than 300px
    if (modal.scrollTop > 300) {
      stickyBtn.style.display = "block";
    } else {
      stickyBtn.style.display = "none";
    }
  }
}

function goBackFromViewFiles() {
  console.log("↩️ [User] Going back from view files...");
  closeViewFilesModal();
}

function viewFileFullScreen(pdfPreviewUrl) {
  console.log("🖥️ [User] Opening file in full screen...");
  
  if (pdfPreviewUrl && pdfPreviewUrl !== "#") {
    window.open(pdfPreviewUrl, '_blank');
  } else {
    alert("File preview URL is not available");
  }
}