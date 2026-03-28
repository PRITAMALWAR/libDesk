const mongoose = require("mongoose");

const allowedFeeStatus = ["Paid", "Half Paid", "Pending"];

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, unique: true },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true },
    pin: { type: String, required: true, trim: true },
    joinDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    feeAmount: { type: Number, required: true, min: 0 },
    feeStatus: { type: String, enum: allowedFeeStatus, required: true },
    isBlocked: { type: Boolean, default: false },
    photoUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
