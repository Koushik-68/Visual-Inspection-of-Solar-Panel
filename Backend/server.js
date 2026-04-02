require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const db = require("./config/db"); // ✅ MySQL

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const scheduleRouter = require("./routes/scheduleRoute");
const { loadSchedules } = require("./controllers/scheduleController");

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
