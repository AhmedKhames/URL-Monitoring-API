const jwt = require("jsonwebtoken");

require("dotenv").config();

module.exports = (req, res, next) => {
  const error = new Error("Not Authorized");
  const authHeader = req.get("Authorization");
  let decodedToken;
  try {
    if (!authHeader) {
      req.isAuth = false;
      throw error;
    }
    const token = authHeader.split(" ")[1];

    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      req.isAuth = false;
      throw error;
    }
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
  } catch (error) {
    req.isAuth = false;
    next(error);
  }
};
