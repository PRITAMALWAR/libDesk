const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    attendanceDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance per day
attendanceSchema.index(
  { studentId: 1, attendanceDate: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);