const Schedule = require("../models/Schedule");
const { spawn } = require("child_process");
const path = require("path");

const timers = new Map();

const pythonPath = "C:\\Program Files\\Python312\\python.exe"; // ✅ Correct way


function runAppPy() {
  const projectDir = path.join(__dirname, "..", "project");
  console.log("🚀 Running app.py...");
  const py = spawn(pythonPath, ["app.py"], { cwd: projectDir });

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
  if (delay <= 0) return;

  const timeout = setTimeout(async () => {
    runAppPy();
    timers.delete(id);
    await Schedule.findByIdAndDelete(id).catch(console.error);
  }, delay);

  timers.set(id, timeout);
}

const loadSchedules = async () => {
  const schedules = await Schedule.find();
  schedules.forEach((s) => scheduleJob(s._id.toString(), s.datetime));
};

const createSchedule = async (req, res) => {
  const { datetime, reason } = req.body;
  if (!datetime) {
    return res.status(400).json({ message: "Datetime is required" });
  }

  try {
    const schedule = await Schedule.create({ datetime, reason });
    scheduleJob(schedule._id.toString(), datetime);
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
