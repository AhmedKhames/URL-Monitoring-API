const express = require("express");
const { body } = require("express-validator");

const isAuth = require("../middleware/isAuth");
const checkController = require("../controllers/checkController");

const router = express.Router();

router.post(
  "/create",
  isAuth,
  [
    body("name").trim().not().isEmpty(),
    body("url").trim().not().isEmpty(),
    body("protocol").trim().not().isEmpty(),
  ],
  checkController.createCheck
);

router.delete("/delete/:checkId", isAuth, checkController.deleteCheck);

router.put("/update/:checkId", isAuth, checkController.updateCheck);

router.get("/all", isAuth, checkController.getAllChecks);

router.get("/:checkId", isAuth, checkController.getCheckById);

module.exports = router;
