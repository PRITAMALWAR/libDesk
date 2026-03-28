const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const qrRoutes = require("./routes/qr.routes");
const notificationRoutes = require("./routes/notification.routes");
const { getMongoStatus } = require("./config/db");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "backend",
    db: getMongoStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

module.exports = app;
