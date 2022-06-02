const mongoose = require("mongoose");
const User = require("../models/User");

exports.isValidUser = (value) => {
  return User.findOne({
    email: value,
  }).then((user) => {
    if (user) {
      return Promise.reject("Email is already exists");
    }
  });
};
