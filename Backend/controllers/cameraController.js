const { spawn } = require("child_process");
const path = require("path");

// Track a single camera process (app.py)
let cameraProcess = null;

const pythonPath = process.env.PYTHON_PATH || "python";

function getProjectDir() {
  // __dirname => Backend/controllers, go up twice to repo root, then into project/
  return path.join(__dirname, "..", "..", "project");
}

// Simple status endpoint so frontend can know if camera is running
exports.getCameraStatus = (req, res) => {
  return res.json({ running: !!cameraProcess });
};

exports.startCamera = (req, res) => {
  if (cameraProcess) {
    return res.status(400).json({ message: "Camera is already running" });
  }

  const projectDir = getProjectDir();
  console.log("🚀 Starting camera (app.py) from", projectDir);

  try {
    cameraProcess = spawn(pythonPath, ["app.py"], { cwd: projectDir });

    cameraProcess.on("error", (err) => {
      console.error(
        `Failed to start app.py with Python at "${pythonPath}":`,
        err.message || err,
      );
      cameraProcess = null;
    });

    cameraProcess.stdout.on("data", (data) => {
      console.log("[app.py]", data.toString());
    });

    cameraProcess.stderr.on("data", (data) => {
      console.error("[app.py ERROR]", data.toString());
    });

    cameraProcess.on("close", (code) => {
      console.log(`🔴 app.py exited with code ${code}`);
      cameraProcess = null;
    });

    return res.json({ message: "✅ Camera started" });
  } catch (err) {
    console.error("Error starting camera:", err);
    cameraProcess = null;
    return res.status(500).json({ message: "Failed to start camera" });
  }
};

exports.stopCamera = (req, res) => {
  if (!cameraProcess) {
    return res.status(400).json({ message: "Camera is not running" });
  }

  try {
    cameraProcess.kill();
    cameraProcess = null;
    return res.json({ message: "✅ Camera stopped" });
  } catch (err) {
    console.error("Error stopping camera:", err);
    return res.status(500).json({ message: "Failed to stop camera" });
  }
};
