const express = require("express");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { use } = require("../routes/authRoute");
const formData = require("form-data");
const mailgun = require("mailgun.js");
require("dotenv").config();

const DOMAIN = process.env.MAILGUN_DOMAIN;
const mg = new mailgun(formData);
const client = mg.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

exports.signup = async function (req, res, next) {
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      const error = new Error("validation failed");
      error.statusCode = 422;
      return next(error);
    }

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = jwt.sign(
      {
        email: email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    const user = new User({
      name: name,
      email: email,
      password: hashedPassword,
      VerficationCode: verificationToken,
    });
    const createdUser = await user.save();

    const verificationMessage = {
      from: `test <ahmed@${DOMAIN}>`,
      to: email,
      subject: "Verification email",
      html: `<h1>Email Confirmation</h1>
        <h2>Hello ${name}</h2>
        <p> Please confirm your email by clicking on the following link</p>
        <a>http://${process.env.APPLICATION_HOST}:${process.env.APPLICATION_PORT}/auth/confirm/${verificationToken}</a>
        `,
    };
    await client.messages.create(DOMAIN, verificationMessage);
    res.status(201).json({
      message: "User was registered successfully! Please check your email",
      userId: createdUser._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async function (req, res, next) {
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      const error = new Error("validation failed");
      error.statusCode = 422;
      return next(error);
    }

    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      const error = new Error("Wrong Password");
      error.statusCode = 404;
      throw error;
    }

    if (!user.isVerfied) {
      const error = new Error(
        "You must confirm your account , please check your mail"
      );
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({
      message: "Login Successful",
      loginToken: token,
      userId: user._id.toString(),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.confirmUser = async function (req, res, next) {
  //verfiy token  from the parameter
  const verifyToken = req.params.confirmationCode;

  try {
    const user = await User.findOne({
      VerficationCode: verifyToken,
    });

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }
    user.isVerfied = true;
    user.VerficationCode = "";
    await user.save()
    res.status(200).json({
        message : "User verified please login"
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

};

