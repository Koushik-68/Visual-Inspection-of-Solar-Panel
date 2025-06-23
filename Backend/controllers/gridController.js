const GridConfig = require("../models/GridConfig");

exports.createOrUpdateGrid = async (req, res) => {
  const owner = req.user._id;
  const { rows, columns } = req.body;
  try {
    const grid = await GridConfig.findOneAndUpdate(
      { owner },
      { rows, columns },
      { upsert: true, new: true }
    );
    return res.json(grid);
  } catch (err) {
    console.error("Grid save error:", err);
    return res.status(500).json({ message: "Could not save grid" });
  }
};

exports.getGrid = async (req, res) => {
  const owner = req.user._id;
  try {
    const grid = await GridConfig.findOne({ owner });
    return res.json(grid || { rows: 0, columns: 0 });
  } catch (err) {
    console.error("Grid fetch error:", err);
    return res.status(500).json({ message: "Could not fetch grid" });
  }
};
