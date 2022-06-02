const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const customValidator = require("../utils/customValidator");
const authController = require("../controllers/auth");
const User = require("../models/User");
const isAuth = require("../middleware/isAuth")

router.post(
  "/signup",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Enter valid email")
      .custom(customValidator.isValidUser),
    body("name").isLength({ min: 1 }),
    body("password").isLength({ min: 6 }),
  ],
  
  authController.signup
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Enter valid email"),
    body("password").trim().not().isEmpty(),
  ],
  authController.login
);

router.post('/confirm/:confirmationCode',authController.confirmUser);


module.exports = router;
