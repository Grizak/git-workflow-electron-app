const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const simpleGit = require("simple-git");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets/icon.png"), // Optional: add your icon
    titleBarStyle: "default",
  });

  mainWindow.loadFile(path.join(__dirname, "renderer.html"));

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle("select-repo", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select Git Repository",
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const repoPath = result.filePaths[0];

    // Check if it's a git repository
    try {
      const git = simpleGit(repoPath);
      await git.status();
      return { success: true, path: repoPath };
    } catch (error) {
      return { success: false, error: "Not a valid git repository" };
    }
  }

  return { success: false, error: "No folder selected" };
});

ipcMain.handle("get-repo-status", async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const status = await git.status();
    const branch = await git.branch();

    return {
      success: true,
      status: {
        current: branch.current,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        staged: status.staged,
        conflicted: status.conflicted,
        ahead: status.ahead,
        behind: status.behind,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("stage-files", async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath);
    await git.add(files);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("unstage-files", async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath);
    await git.reset(["HEAD", ...files]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("commit-changes", async (event, repoPath, message) => {
  try {
    const git = simpleGit(repoPath);
    const result = await git.commit(message);
    return { success: true, commit: result.commit };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-file-diff", async (event, repoPath, fileName) => {
  try {
    const git = simpleGit(repoPath);
    const diff = await git.diff([fileName]);
    return { success: true, diff };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-recent-commits", async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const log = await git.log({ maxCount: 10 });
    return { success: true, commits: log.all };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
