const { EventEmitter } = require("events");
const fs = require("fs");

class ConfigManager extends EventEmitter {
  constructor(configFile) {
    super();
    this.config = {};
    this.configFile = configFile;
    this.#loadConfig();
    this.#updateConfigFile();
  }

  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    this.emit("configChange");
  }

  #updateConfigFile() {
    this.on("configChange", () => {
      try {
        fs.writeFileSync(
          this.configFile,
          JSON.stringify(this.config, null, 2),
          "utf8"
        );
      } catch (error) {
        console.error("Failed to save config:", error);
      }
    });
  }

  #loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, "utf8");
        this.config = JSON.parse(data);
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      this.config = {};
    }
  }
}

module.exports = ConfigManager;
