const jwt = require("jsonwebtoken");
const ACCESS_TOKEN_SECRET = "supersecret_access";

const getUserFromToken = (token) => {
  try {

    if (token) {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      return { id: decoded.userId };
    }
    return null;
  } catch (err) {
    console.error("Token verification error:", err.message);
    return null;
  }
};

const authMiddleware = (req, res, next) => {
  //console.log("authMiddleware: Processing", { path: req.path, headers: req.headers });
  if (!req || !req.headers) {
    //console.log("authMiddleware: No req or headers, setting user to null");
    req.user = null;
    return next();
  }

  const token = req.headers.authorization?.replace("Bearer ", "") || "";
  const user = getUserFromToken(token);
  req.user = user;
  console.log(req.user);
  next();
};

module.exports = authMiddleware;