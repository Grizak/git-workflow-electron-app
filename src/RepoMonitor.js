const { EventEmitter } = require("events");
const chokidar = require("chokidar");
const simpleGit = require("simple-git");
const path = require("path");

const onChange = async function (filePath) {
  try {
    const status = await this.git.status();

    // Check if there are any actual git changes
    const hasChanges =
      status.modified.length > 0 ||
      status.created.length > 0 ||
      status.deleted.length > 0 ||
      status.not_added.length > 0 ||
      status.conflicted.length > 0 ||
      status.staged.length > 0;

    if (hasChanges) {
      this.emit("file-changed", this.getRelativePath(filePath));
    }
  } catch (error) {
    console.error("Error checking git status:", error);
  }
};

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

    const boundOnChange = onChange.bind(this);

    this.watcher
      .on("add", boundOnChange)
      .on("change", boundOnChange)
      .on("unlink", boundOnChange);
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
