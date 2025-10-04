const { EventEmitter } = require("events");
const chokidar = require("chokidar");
const simpleGit = require("simple-git");
const path = require("path");

class RepoMonitor extends EventEmitter {
  constructor(repoPath) {
    super();
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
    this.watcher = null;
  }

  start() {
    this.watcher = chokidar.watch(this.repoPath, {
      persistent: true,
      ignoreInitial: true,
      ignored: /(^|[\/\\])\../, // ignore dotfiles/folders like .git
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    this.watcher
      .on("add", (filePath) => {
        this.emit("file-changed", this.getRelativePath(filePath));
      })
      .on("change", (filePath) => {
        this.emit("file-changed", this.getRelativePath(filePath));
      })
      .on("unlink", (filePath) => {
        this.emit("file-changed", this.getRelativePath(filePath));
      });
  }

  getRelativePath(filePath) {
    return path.relative(this.repoPath, filePath);
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}

module.exports = RepoMonitor;
