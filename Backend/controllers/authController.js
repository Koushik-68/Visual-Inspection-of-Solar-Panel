const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

exports.register = async (req, res) => {
  const { username, password } = req.body;
  // console.log(req.body);
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "Username taken" });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, password: hash });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "lax",
    });

    res.status(201).json({ message: "User created", token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "lax",
    });

    res.json({ message: "Logged in", token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

exports.getMe = async (req, res) => {
  try {
    res.json({ user: { id: req.user._id, username: req.user.username } });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
