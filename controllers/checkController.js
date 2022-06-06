const express = require("express");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { use } = require("../routes/authRoute");
const formData = require("form-data");
const mailgun = require("mailgun.js");
const Check = require("../models/Check");
const Report = require("../models/Report");

require("dotenv").config();

exports.createCheck = async function (req, res, next) {
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      const error = new Error("validation failed");
      error.statusCode = 422;
      return next(error);
    }
    const name = req.body.name,
      url = req.body.url,
      protocol = req.body.protocol,
      path = req.body.path,
      webhook = req.body.webhook,
      timeout = req.body.timeout,
      interval = req.body.interval,
      threshold = req.body.threshold,
      tags = req.body.tags,
      port = req.body.port,
      httpHeaders = req.body.httpHeaders,
      ignoreSSL = req.body.ignoreSSL;
    userId = req.userId;

    const check = await Check({
      name: name,
      url: url,
      protocol: protocol,
      path: path,
      webhook: webhook,
      timeout: timeout,
      interval: interval,
      threshold: threshold,
      tags: tags,
      port: port,
      httpHeaders: httpHeaders,
      ignoreSSL: ignoreSSL,
      userId: userId,
    });
    const createdCheck = await check.save();
    res.status(201).json({
      message: `Check for url : ${createdCheck.url} is created`,
      checkId: createdCheck._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAllChecks = async function (req, res, next) {
  try {
    const checks = await Check.find({ userId: req.userId }).populate(
      "userId",
      "email"
    );
    if (checks.length === 0) {
      const error = new Error("No Checks found");
      error.statusCode = 404;
      throw error;
    }
    const currentUser = await User.findById(req.userId);
    res.status(200).json({
      message: `${currentUser.email} Checks`,
      Checks: checks,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getCheckById = async function (req, res, next) {
  try {
    const checkId = req.params.checkId;

    const check = await Check.findOne({
      _id: checkId,
      userId: req.userId,
    }).populate("userId", "email");

    if (!check) {
      const error = new Error("No Checks found");
      error.statusCode = 404;
      throw error;
    }
    const currentUser = await User.findById(req.userId);
    res.status(200).json({
      message: `${currentUser.email} Check`,
      Check: check,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteCheck = async function (req, res, next) {
  try {
    const checkId = req.params.checkId;
    await Check.deleteOne({
      _id: checkId,
      userId: req.userId,
    });
    await Report.deleteMany({
      checkId: checkId,
      userId: req.userId,
    })
    res.status(200).json({
      message: `Check ${checkId} is deleted`,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateCheck = async function (req, res, next) {
  try {
    const checkId = req.params.checkId;

    const name = req.body.name,
      url = req.body.url,
      protocol = req.body.protocol,
      path = req.body.path,
      webhook = req.body.webhook,
      timeout = req.body.timeout,
      interval = req.body.interval,
      threshold = req.body.threshold,
      tags = req.body.tags,
      port = req.body.port,
      httpHeaders = req.body.httpHeaders,
      ignoreSSL = req.body.ignoreSSL;
    userId = req.userId;

    const check = await Check.findOne({
      _id: checkId,
      userId: userId,
    });

    check.name = name;
    check.url = url;
    check.protocol = protocol;
    check.path = path;
    check.webhook = webhook;
    check.timeout = timeout;
    check.interval = interval;
    check.threshold = threshold;
    check.tags.push(...tags);
    check.port = port;
    check.httpHeaders.push(...httpHeaders);
    check.ignoreSSL = ignoreSSL;
    check.save();

    res.status(200).json({
      message: `Check ${checkId} updated`,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
