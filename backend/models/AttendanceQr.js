const mongoose = require("mongoose");

const attendanceQrSchema = new mongoose.Schema(
  {
    libraryId: {
      type: String,
      required: true,
      trim: true
    },
    token: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
  },
  { timestamps: true }
);

// Only keep this (good for expiry queries)
attendanceQrSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("AttendanceQr", attendanceQrSchema);