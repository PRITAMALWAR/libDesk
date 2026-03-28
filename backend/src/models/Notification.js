const mongoose = require("mongoose");

const NOTIFICATION_CATEGORIES = [
  "general",
  "festival",
  "closure",
  "hours",
  "rules",
  "event",
];

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    targetId: { type: String, default: "all", trim: true },
    category: {
      type: String,
      enum: NOTIFICATION_CATEGORIES,
      default: "general",
      trim: true,
    },
  },
  { timestamps: true }
);

// Auto-delete documents 30 days after the `date` field
notificationSchema.index({ date: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("Notification", notificationSchema);
