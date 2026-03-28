const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const AttendanceQr = require("../models/AttendanceQr");
const Student = require("../models/Student");

const router = express.Router();

const LIBRARY_ID = process.env.LIBRARY_ID || "library-main";
const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || "library-auth-secret";

function createOpaqueAttendanceToken() {
  return crypto.randomBytes(32).toString("hex");
}

function isSameYearMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getAttendanceHourWindow() {
  const start = Number(process.env.ATTENDANCE_HOUR_START);
  const end = Number(process.env.ATTENDANCE_HOUR_END);
  return {
    start: Number.isFinite(start) ? start : 0,
    end: Number.isFinite(end) ? end : 23,
  };
}

async function repairAttendanceIndexes() {
  try {
    const indexes = await Attendance.collection.indexes();
    for (const idx of indexes) {
      if (!idx.unique || !idx.name || idx.name === "_id_") continue;
      const keys = Object.keys(idx.key || {});
      const isExpectedUnique =
        keys.length === 2 &&
        keys.includes("studentId") &&
        keys.includes("attendanceDate") &&
        Number(idx.key.studentId) === 1 &&
        Number(idx.key.attendanceDate) === 1;
      const badUnique = !isExpectedUnique;
      if (badUnique) {
        await Attendance.collection.dropIndex(idx.name);
      }
    }
    await Attendance.collection.createIndex(
      { studentId: 1, attendanceDate: 1 },
      { unique: true, name: "studentId_1_attendanceDate_1" }
    );
  } catch {
    // Best-effort self-heal only.
  }
}

function toResponse(attendance) {
  const safeDate =
    attendance?.date instanceof Date
      ? attendance.date.toISOString()
      : attendance?.date
        ? new Date(attendance.date).toISOString()
        : new Date().toISOString();

  return {
    id: attendance?._id ? attendance._id.toString() : "",
    studentId: attendance?.studentId != null ? String(attendance.studentId) : "",
    date: safeDate,
  };
}

function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function getActiveQr() {
  const now = new Date();
  return AttendanceQr.findOne({ expiresAt: { $gt: now } }).sort({ generatedAt: -1 });
}

/** Strip whitespace / control chars scanners often insert inside the token. */
function sanitizeAttendanceTokenString(t) {
  const n = normalizeScannedAttendanceToken(t);
  return n.replace(/[\s\u0000-\u001F\u007F-\u009F]+/g, "");
}

/**
 * Match scanned payload to any non-expired QR row (not only the newest).
 * Newest-first scan handles multiple active rows after admin rotates code.
 */
async function findActiveQrByScannedToken(scannedToken) {
  const want = sanitizeAttendanceTokenString(scannedToken);
  if (!want) return null;
  const now = new Date();
  const rows = await AttendanceQr.find({ expiresAt: { $gt: now } }).sort({ generatedAt: -1 });
  for (const row of rows) {
    if (sanitizeAttendanceTokenString(row.token) === want) return row;
  }
  return null;
}

function isWithinAttendanceWindow() {
  const { start, end } = getAttendanceHourWindow();
  const hour = new Date().getHours();
  return hour >= start && hour <= end;
}

/** Normalize camera / scanner output so it matches the stored token. */
function normalizeScannedAttendanceToken(raw) {
  let s = String(raw || "").trim();
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1).trim();

  if (s.startsWith("{")) {
    try {
      const o = JSON.parse(s);
      if (o && typeof o.token === "string") return o.token.trim();
      if (o && typeof o.t === "string") return o.t.trim();
    } catch {
      // ignore
    }
  }

  try {
    if (s.startsWith("http://") || s.startsWith("https://")) {
      const u = new URL(s);
      const d = u.searchParams.get("data");
      if (d) return decodeURIComponent(d).trim();
    }
  } catch {
    // ignore
  }

  const dataMatch = s.match(/(?:^|[?&])data=([^&]+)/);
  if (dataMatch) {
    try {
      return decodeURIComponent(dataMatch[1]).trim();
    } catch {
      // ignore
    }
  }

  return s;
}

router.get("/token", async (_req, res) => {
  try {
    const active = await getActiveQr();
    if (!active) {
      return res.json({ token: null, libraryId: LIBRARY_ID, generated: false });
    }
    return res.json({
      token: active.token,
      libraryId: active.libraryId,
      generatedAt: active.generatedAt.toISOString(),
      expiresAt: active.expiresAt.toISOString(),
      generated: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch QR token", error: error.message });
  }
});

router.post("/token", async (req, res) => {
  try {
    const forceNew = Boolean(req.body?.rotate);
    const now = new Date();

    const existing = await getActiveQr();
    if (existing) {
      // Admin can rotate QR only once per month.
      if (forceNew && isSameYearMonth(new Date(existing.generatedAt), now)) {
        return res.status(200).json({
          token: existing.token,
          libraryId: existing.libraryId,
          generatedAt: existing.generatedAt.toISOString(),
          expiresAt: existing.expiresAt.toISOString(),
          created: false,
          locked: true,
          message: "QR code can be changed only once in a month.",
        });
      }

      if (!forceNew) {
        return res.json({
          token: existing.token,
          libraryId: existing.libraryId,
          generatedAt: existing.generatedAt.toISOString(),
          expiresAt: existing.expiresAt.toISOString(),
          created: false,
        });
      }
    }

    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const token = createOpaqueAttendanceToken();

    const created = await AttendanceQr.create({
      libraryId: LIBRARY_ID,
      token,
      generatedAt: now,
      expiresAt,
    });

    return res.json({
      token: created.token,
      libraryId: created.libraryId,
      generatedAt: created.generatedAt.toISOString(),
      expiresAt: created.expiresAt.toISOString(),
      created: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate QR token", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const dateQuery = req.query.date ? new Date(String(req.query.date)) : new Date();
    if (Number.isNaN(dateQuery.getTime())) {
      return res.status(400).json({ message: "Invalid date. Use YYYY-MM-DD" });
    }
    const dateKey = toDateKey(dateQuery);
    const list = await Attendance.find({ attendanceDate: dateKey }).sort({ date: -1 });
    return res.json(list.map(toResponse));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch attendance", error: error.message });
  }
});

router.get("/today", async (_req, res) => {
  try {
    const todayKey = toDateKey(new Date());
    const list = await Attendance.find({ attendanceDate: todayKey }).sort({ date: -1 });
    return res.json(list.map(toResponse));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch attendance", error: error.message });
  }
});

router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = String(req.params.studentId || "").trim();
    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    const now = new Date();
    const year = Number(req.query.year || now.getFullYear());
    const month = Number(req.query.month || now.getMonth() + 1);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid year/month" });
    }

    const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;

    const list = await Attendance.find({
      studentId,
      attendanceDate: { $regex: `^${monthPrefix}` },
    }).sort({ date: 1 });

    const seen = new Set();
    const result = [];
    for (const item of list) {
      const dateKey = toDateKey(new Date(item.date));
      if (seen.has(dateKey)) continue;
      seen.add(dateKey);
      result.push({ date: dateKey, status: "present" });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch student attendance", error: error.message });
  }
});

router.post("/mark", async (req, res) => {
  try {
    const { token } = req.body || {};
    const scannedToken = normalizeScannedAttendanceToken(token);
    const authHeader = String(req.headers.authorization || "");
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!bearer) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let authPayload;
    try {
      authPayload = jwt.verify(bearer, AUTH_JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid auth token" });
    }

    if (!authPayload || authPayload.role !== "student" || !authPayload.userId) {
      return res.status(403).json({ message: "Only student can mark attendance" });
    }
    const normalizedStudentId = String(authPayload.userId).trim();
    if (!mongoose.Types.ObjectId.isValid(normalizedStudentId)) {
      return res.status(400).json({ message: "Invalid student account" });
    }

    // 1) पहले check करो आज attendance already marked है या नहीं
    const now = new Date();
    const todayKey = toDateKey(now);
    const existing = await Attendance.findOne({
      studentId: normalizedStudentId,
      attendanceDate: todayKey,
    });
    if (existing) {
      return res.json({
        ok: true,
        alreadyMarked: true,
        message: "Today s attendance has already been marked. ✅",
        attendance: toResponse(existing),
      });
    }

    if (!sanitizeAttendanceTokenString(scannedToken)) {
      return res.status(400).json({ message: "token is required" });
    }

    const active = await findActiveQrByScannedToken(scannedToken);
    if (!active) {
      const anyActive = await getActiveQr();
      if (!anyActive) {
        return res.status(400).json({
          message: "Attendance QR is not active. Ask staff to open Attendance and tap New code.",
        });
      }
      return res.status(400).json({
        message: "This QR does not match the current library code. Scan the code on the admin screen or ask for a fresh print.",
      });
    }

    if (String(active.libraryId || "").trim() !== LIBRARY_ID) {
      return res.status(400).json({ message: "Invalid QR token" });
    }

    if (!isWithinAttendanceWindow()) {
      const { start, end } = getAttendanceHourWindow();
      return res.status(400).json({
        message: `Attendance is only allowed between ${String(start).padStart(2, "0")}:00 and ${String(end).padStart(2, "0")}:59 (server time). Set ATTENDANCE_HOUR_START / ATTENDANCE_HOUR_END in .env to change.`,
      });
    }

    const student = await Student.findById(normalizedStudentId);
    if (!student) {
      return res.status(400).json({ message: "Student not found" });
    }
    if (student.isBlocked) {
      return res.status(403).json({ message: "Student is blocked" });
    }

    const created = await Attendance.create({
      studentId: normalizedStudentId,
      date: now,
      attendanceDate: todayKey,
    });
    return res.status(201).json({
      ok: true,
      message: "Attendance Marked",
      attendance: toResponse(created),
    });
  } catch (error) {
    if (error?.code === 11000) {
      const now = new Date();
      const todayKey = toDateKey(now);
      const authHeader = String(req.headers.authorization || "");
      const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      let normalizedStudentId = "";
      try {
        const authPayload = bearer ? jwt.verify(bearer, AUTH_JWT_SECRET) : null;
        normalizedStudentId = String(authPayload?.userId || "").trim();
      } catch {
        normalizedStudentId = "";
      }
      if (!mongoose.Types.ObjectId.isValid(normalizedStudentId)) {
        return res.status(400).json({ message: "Invalid student account" });
      }
      const sameStudentToday = await Attendance.findOne({
        studentId: normalizedStudentId,
        attendanceDate: todayKey,
      });
      if (sameStudentToday) {
        return res.json({
          ok: true,
          alreadyMarked: true,
          message: "Today s attendance has already been marked ✅",
          attendance: toResponse(sameStudentToday),
        });
      }

      // Self-heal bad unique indexes from older versions and retry once.
      await repairAttendanceIndexes();
      const recheck = await Attendance.findOne({
        studentId: normalizedStudentId,
        attendanceDate: todayKey,
      });
      if (recheck) {
        return res.json({
          ok: true,
          alreadyMarked: true,
          message: "Today s attendance has already been marked ✅",
          attendance: toResponse(recheck),
        });
      }

      try {
        const retried = await Attendance.create({
          studentId: normalizedStudentId,
          date: now,
          attendanceDate: toDateKey(now),
        });
        return res.status(201).json({
          ok: true,
          message: "Attendance Marked",
          attendance: toResponse(retried),
        });
      } catch (retryError) {
        return res.status(500).json({
          message: "Attendance save failed. Please try again.",
          error: retryError.message,
        });
      }
    }
    return res.status(500).json({ message: "Failed to mark attendance", error: error.message });
  }
});

module.exports = router;
