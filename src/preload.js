const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectRepo: () => ipcRenderer.invoke("select-repo"),
  getRepoStatus: (repoPath) => ipcRenderer.invoke("get-repo-status", repoPath),
  stageFiles: (repoPath, files) =>
    ipcRenderer.invoke("stage-files", repoPath, files),
  unstageFiles: (repoPath, files) =>
    ipcRenderer.invoke("unstage-files", repoPath, files),
  commitChanges: (repoPath, message) =>
    ipcRenderer.invoke("commit-changes", repoPath, message),
  getFileDiff: (repoPath, fileName) =>
    ipcRenderer.invoke("get-file-diff", repoPath, fileName),
  getRecentCommits: (repoPath) =>
    ipcRenderer.invoke("get-recent-commits", repoPath),
  onFileChange: (callback) => ipcRenderer.on("file-changed", callback),
});
