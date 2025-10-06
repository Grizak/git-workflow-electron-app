import "./renderer.css";

let currentRepo = null;
let selectedFiles = new Set();
let repoStatus = null;

// DOM Elements
const selectRepoBtn = document.getElementById("selectRepo");
const refreshRepoBtn = document.getElementById("refreshRepo");
const repoPathSpan = document.getElementById("repoPath");
const branchInfo = document.getElementById("branchInfo");
const fileList = document.getElementById("fileList");
const fileStats = document.getElementById("fileStats");
const stageSelectedBtn = document.getElementById("stageSelected");
const unstageSelectedBtn = document.getElementById("unstageSelected");
const stageAllBtn = document.getElementById("stageAll");
const commitMessage = document.getElementById("commitMessage");
const commitBtn = document.getElementById("commitBtn");
const recentCommits = document.getElementById("recentCommits");
const syncBtn = document.getElementById("syncBtn");

// Event Listeners
selectRepoBtn.addEventListener("click", selectRepository);
refreshRepoBtn.addEventListener("click", refreshRepository);
stageSelectedBtn.addEventListener("click", stageSelectedFiles);
unstageSelectedBtn.addEventListener("click", unstageSelectedFiles);
stageAllBtn.addEventListener("click", stageAllFiles);
commitBtn.addEventListener("click", commitChanges);
syncBtn.addEventListener("click", sync);

commitMessage.addEventListener("input", updateCommitButton);

async function selectRepository() {
  try {
    const result = await window.electronAPI.selectRepo();
    if (result.success) {
      currentRepo = result.path;
      repoPathSpan.textContent = currentRepo;
      refreshRepoBtn.disabled = false;
      await loadRepositoryData();
    } else {
      showError(result.error);
    }
  } catch (error) {
    showError("Failed to select repository");
  }
}

async function refreshRepository(showLoading = true) {
  if (currentRepo) {
    await loadRepositoryData(showLoading);
  }
}

async function loadRepositoryData(showLoading = true) {
  try {
    if (showLoading) {
      fileList.innerHTML = '<div class="loading">Loading...</div>';
      recentCommits.innerHTML = '<div class="loading">Loading...</div>';
    }
    const [statusResult, commitsResult] = await Promise.all([
      window.electronAPI.getRepoStatus(currentRepo),
      window.electronAPI.getRecentCommits(currentRepo),
    ]);

    if (statusResult.success) {
      repoStatus = statusResult.status;
      displayRepositoryStatus();
      displayFileList();
    } else {
      showError(statusResult.error);
    }

    if (commitsResult.success) {
      displayRecentCommits(commitsResult.commits);
    }
  } catch (error) {
    showError("Failed to load repository data");
  }
}

function displayRepositoryStatus() {
  const branch = repoStatus.current;
  branchInfo.innerHTML = `Branch: <span class="branch-name">${branch}</span>`;

  const totalChanges =
    (repoStatus.modified?.length || 0) +
    (repoStatus.created?.length || 0) +
    (repoStatus.deleted?.length || 0) +
    (repoStatus.not_added?.length || 0);
  const stagedChanges = repoStatus.staged.length;
  fileStats.textContent = `${totalChanges} changes, ${stagedChanges} staged`;
}

function displayFileList() {
  const allFiles = [
    ...(repoStatus.modified || []).map((file) => ({
      name: file,
      status: "modified",
    })),
    ...(repoStatus.created || []).map((file) => ({
      name: file,
      status: "added",
    })),
    ...(repoStatus.deleted || []).map((file) => ({
      name: file,
      status: "deleted",
    })),
    ...(repoStatus.staged || []).map((file) => ({
      name: file,
      status: "staged",
    })),
    ...(repoStatus.not_added || []).map((file) => ({
      name: file,
      status: "untracked",
    })),
  ];

  if (allFiles.length === 0) {
    fileList.innerHTML = '<div class="no-repo">No changes to commit</div>';
    return;
  }

  fileList.innerHTML = allFiles
    .map(
      (file) => `
                <div class="file-item" data-file="${file.name}">
                    <input type="checkbox" class="file-checkbox" data-file="${
                      file.name
                    }">
                    <span class="file-name">${file.name}</span>
                    <span class="file-status status-${
                      file.status
                    }">${file.status.toUpperCase()}</span>
                </div>
            `
    )
    .join("");

  // Add click handlers
  fileList.querySelectorAll(".file-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.type !== "checkbox") {
        const checkbox = item.querySelector(".file-checkbox");
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change"));
      }
    });
  });

  fileList.querySelectorAll(".file-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const fileName = e.target.dataset.file;
      if (e.target.checked) {
        selectedFiles.add(fileName);
      } else {
        selectedFiles.delete(fileName);
      }
      updateButtons();
    });
  });

  updateButtons();
}

function displayRecentCommits(commits) {
  if (commits.length === 0) {
    recentCommits.innerHTML = '<div class="loading">No recent commits</div>';
    return;
  }

  recentCommits.innerHTML = commits
    .map(
      (commit) => `
                <div class="commit-item">
                    <div class="commit-hash">${commit.hash.substring(
                      0,
                      7
                    )}</div>
                    <div class="commit-msg">${commit.message}</div>
                    <div class="commit-author">${
                      commit.author_name
                    } • ${new Date(commit.date).toLocaleDateString()}</div>
                </div>
            `
    )
    .join("");
}

async function stageSelectedFiles() {
  if (selectedFiles.size === 0) return;

  try {
    const files = Array.from(selectedFiles);
    const result = await window.electronAPI.stageFiles(currentRepo, files);
    if (result.success) {
      selectedFiles.clear();
      await loadRepositoryData();
    } else {
      showError(result.error);
    }
  } catch (error) {
    showError("Failed to stage files");
  }
}

async function unstageSelectedFiles() {
  if (selectedFiles.size === 0) return;

  try {
    const files = Array.from(selectedFiles);
    const result = await window.electronAPI.unstageFiles(currentRepo, files);
    if (result.success) {
      selectedFiles.clear();
      await loadRepositoryData();
    } else {
      showError(result.error);
    }
  } catch (error) {
    showError("Failed to unstage files");
  }
}

async function stageAllFiles() {
  try {
    const allFiles = [
      ...repoStatus.modified,
      ...repoStatus.created,
      ...repoStatus.deleted,
      ...repoStatus.not_added,
    ];
    if (allFiles.length === 0) return;

    const result = await window.electronAPI.stageFiles(currentRepo, allFiles);
    if (result.success) {
      selectedFiles.clear();
      await loadRepositoryData();
    } else {
      showError(result.error);
    }
  } catch (error) {
    showError("Failed to stage all files");
  }
}

async function commitChanges() {
  const message = commitMessage.value.trim();
  if (!message || !currentRepo) return;

  try {
    const message = commitMessage.value.trim();
    const result = await window.electronAPI.commitChanges(currentRepo, message);

    if (result.success) {
      commitMessage.value = "";
      await loadRepositoryData();
      showSuccess(`Committed: ${result.commit}`);
    } else {
      showError(result.error);
    }
  } catch (error) {
    showError("Failed to commit changes");
  }
}

function updateCommitButton() {
  const hasMessage = commitMessage.value.trim().length > 0;
  const hasStagedFiles = repoStatus && repoStatus.staged.length > 0;
  commitBtn.disabled = !hasMessage || !hasStagedFiles || !currentRepo;
}

function updateButtons() {
  const hasSelection = selectedFiles.size > 0;
  const hasFiles =
    repoStatus &&
    repoStatus.modified.length +
      repoStatus.created.length +
      repoStatus.deleted.length +
      repoStatus.not_added.length >
      0;

  stageSelectedBtn.disabled = !hasSelection || !currentRepo;
  unstageSelectedBtn.disabled = !hasSelection || !currentRepo;
  stageAllBtn.disabled = !hasFiles || !currentRepo;

  updateCommitButton();
}

function showError(message) {
  // Simple error display - could be enhanced with a proper notification system
  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.style.cssText =
    "position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 10px; border-radius: 4px; z-index: 1000;";
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 3000);
}

async function sync(event) {
  syncBtn.disabled = true;
  syncBtn.classList.add("spinning-border");
  syncBtn.textContent = "Syncing to upstream";
  const result = await window.electronAPI.syncGit(currentRepo);
  syncBtn.disabled = false;
  syncBtn.classList.remove("spinning-border");
  if (result.success) {
    syncBtn.textContent = "Sync changes from upstream";
  } else {
    syncBtn.textContent = "Failed to sync from upstream";
    setTimeout(
      () => (syncBtn.textContent = "Sync changes from upstream"),
      10000
    );
  }
}

window.electronAPI.onFileChange(() => refreshRepository(false));
window.electronAPI.onRepositoryConfig(async (repositoryPath) => {
  currentRepo = repositoryPath;
  repoPathSpan.textContent = currentRepo;
  refreshRepoBtn.disabled = false;
  await loadRepositoryData();
});
