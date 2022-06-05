const mongoose = require("mongoose");
const { Schema } = mongoose;

const Report = new Schema(
  {
    checkId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Check",
    },
    status: { //code
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
    responseTime: { // time between request and response
      type: Number,
      required: true,
    },
    outages:{
      type: Number,
      required: true,
    },
    history: {
      type: [Object],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", Report);
