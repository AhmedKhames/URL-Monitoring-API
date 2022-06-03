const mongoose = require("mongoose");
const { Schema } = mongoose;

const Report = new Schema(
  {
    checkId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Check",
    },
    status: {
      type: String,
      required: true,
    },
    availability: {
      type: Number,
      required: true,
    },
    downTime: {
      type: Number,
      required: true,
    },
    upTime: {
      type: Number,
      required: true,
    },
    responseTime: {
      type: Number,
      required: true,
    },
    history: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", Report);
