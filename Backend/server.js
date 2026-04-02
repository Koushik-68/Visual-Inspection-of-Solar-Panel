require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const db = require("./config/db"); // ✅ MySQL

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const scheduleRouter = require("./routes/scheduleRoute");
const { loadSchedules } = require("./controllers/scheduleController");
const panelCtrl = require("./controllers/panelController");
const cameraCtrl = require("./controllers/cameraController");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/schedule", scheduleRouter);

// Camera control (manual app.py start/stop from dashboard)
app.get("/api/camera/status", authMiddleware, cameraCtrl.getCameraStatus);
app.post("/api/camera/start", authMiddleware, cameraCtrl.startCamera);
app.post("/api/camera/stop", authMiddleware, cameraCtrl.stopCamera);

// Detection updates (no auth) - called from Python app
app.post("/api/panels/detection-update", panelCtrl.updatePanelFromDetection);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await db.init(); // ✅ Initialize MySQL
    console.log("✅ MySQL connected successfully!");
    console.log(`✅Connected to DB: ${process.env.DB_NAME}`);

    // loadSchedules();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
  }
});
