const jwt = require("jsonwebtoken");
const db = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.query(
      "SELECT id, username FROM users WHERE id = ?",
      [decoded.id],
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = rows[0]; // { id, username }
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
};
