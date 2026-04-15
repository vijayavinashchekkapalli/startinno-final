// ==================== PAGE INITIALIZATION ====================

const teamNames = {};
let selectedProblemId = null;
let allProblems = [];
let autoRefreshInterval = null;

window.onload = function() {
  loadProblems();
  startAutoRefresh();
};

function startAutoRefresh() {
  // Auto-refresh every 15 seconds to sync with admin changes
  autoRefreshInterval = setInterval(() => {
    loadProblems();
  }, 15000);
}

// ==================== LOAD PROBLEMS ====================

async function loadProblems() {
  const container = document.getElementById("problems");
  
  try {
    const res = await fetch("/api/getProblems?t=" + Date.now()); // Bypass cache
    
    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }

    const data = await res.json();
    allProblems = data || [];

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
    data.forEach((p, index) => {
      const isFull = p.selectedTeams >= p.maxTeams;
      const isSelected = teamNames[p._id] ? true : false;

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
              class="problem-circle ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}"
              onclick="openTeamNameModal('${p._id}')" 
              ${isFull ? 'disabled' : ''}
              title="${isSelected ? 'Team: ' + teamNames[p._id] : 'Click to select this problem'}"
            >
              ${isSelected ? '✓' : '◯'}
            </button>
            ${isSelected ? `<p class="selected-team">Team: ${teamNames[p._id]}</p>` : ''}
          </div>
          <button 
            class="btn-submit ${!isSelected || isFull ? 'disabled' : ''}"
            onclick="submit('${p._id}')" 
            ${!isSelected || isFull ? 'disabled' : ''}
          >
            ${isFull ? '🔒 FULL' : isSelected ? 'Submit Team' : 'Select'}
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