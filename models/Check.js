const mongoose = require("mongoose");
const { Schema } = mongoose;

const Check = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    protocol: {
      type: String,
      required: true,
      default: "https",
    },

    path: String,
    webhook: String,
    timeout: {
      type: Number,
      default: 5, //second
    },
    interval: {
      type: Number,
      default: 600, //second
    },
    threshold: {
      type: Number,
      default: 1,
    },
    tags: {
      type: [String],
    },
    port: {
      type: Number,
    },

    httpHeaders: [
      {
        header: String,
      },
    ],
    ignoreSSL: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Check", Check);
