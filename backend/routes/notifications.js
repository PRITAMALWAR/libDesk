const express = require("express");
const Notification = require("../models/Notification");

const router = express.Router();

const ALLOWED_CATEGORIES = new Set(["general", "festival", "closure", "hours", "rules", "event"]);

function normalizeCategory(value) {
  const v = typeof value === "string" ? value.trim() : "";
  return ALLOWED_CATEGORIES.has(v) ? v : "general";
}

function toResponse(notification) {
  return {
    id: notification._id.toString(),
    title: notification.title,
    message: notification.message,
    date: notification.date.toISOString(),
    targetId: notification.targetId,
    category: notification.category || "general",
  };
}

router.get("/", async (req, res) => {
  try {
    const studentId = req.query.studentId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const base = { date: { $gte: thirtyDaysAgo } };
    const query = studentId
      ? { ...base, $or: [{ targetId: "all" }, { targetId: studentId }] }
      : base;

    const list = await Notification.find(query).sort({ date: -1 });
    res.json(list.map(toResponse));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, message, targetId = "all", category: rawCategory } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ message: "title and message are required" });
    }

    const category = normalizeCategory(rawCategory);

    const created = await Notification.create({
      title,
      message,
      targetId,
      category,
      date: new Date(),
    });

    return res.status(201).json(toResponse(created));
  } catch (error) {
    return res.status(500).json({ message: "Failed to send notification", error: error.message });
  }
});

module.exports = router;
