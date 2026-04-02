const { spawn } = require("child_process");
const path = require("path");

// In-memory storage for scheduled jobs (no MongoDB/Mongoose)
const timers = new Map();
const schedules = new Map();

// Use configurable Python path; fall back to "python" from PATH
const pythonPath = process.env.PYTHON_PATH || "python";

function runAppPy() {
  // __dirname => Backend/controllers, go up twice to repo root, then into project/
  const projectDir = path.join(__dirname, "..", "..", "project");
  console.log("🚀 Running app.py...");
  const py = spawn(pythonPath, ["app.py"], { cwd: projectDir });

  py.on("error", (err) => {
    console.error(
      `Failed to start app.py with Python at "${pythonPath}":`,
      err.message || err,
    );
  });

  py.stdout.on("data", (data) => {
    console.log("[app.py]", data.toString());
  });

  py.stderr.on("data", (err) => {
    console.error("[app.py ERROR]", err.toString());
  });

  py.on("close", (code) => {
    console.log(`🔴 app.py exited with code ${code}`);
  });
}

function scheduleJob(id, datetime) {
  const delay = new Date(datetime) - Date.now();
  if (delay <= 0) {
    return;
  }

  const timeout = setTimeout(() => {
    runAppPy();
    timers.delete(id);
    schedules.delete(id);
  }, delay);

  timers.set(id, timeout);
}

// No-op placeholder so existing import in server.js remains safe
const loadSchedules = async () => {
  // Intentionally left blank: schedules are kept only in memory now
};

const createSchedule = async (req, res) => {
  const { datetime, reason } = req.body;
  if (!datetime) {
    return res.status(400).json({ message: "Datetime is required" });
  }

  try {
    const id = Date.now().toString();
    const schedule = {
      id,
      datetime,
      reason,
      createdAt: new Date(),
    };

    schedules.set(id, schedule);
    scheduleJob(id, datetime);

    res.json({ message: "✅ Scheduled successfully", schedule });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  loadSchedules,
  createSchedule,
};
