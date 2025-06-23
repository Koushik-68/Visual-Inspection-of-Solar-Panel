const router = require("express").Router();
const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

module.exports = router;
