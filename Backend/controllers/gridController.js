const db = require("../config/db");

// Create or update the grid configuration for the current user
exports.createOrUpdateGrid = async (req, res) => {
  const userId = req.user.id;
  const { rows, columns } = req.body;

  if (
    rows === undefined ||
    columns === undefined ||
    Number.isNaN(Number(rows)) ||
    Number.isNaN(Number(columns))
  ) {
    return res
      .status(400)
      .json({ message: "rows and columns must be valid numbers" });
  }

  try {
    // Upsert grid_config row per user
    await db.query(
      `INSERT INTO grid_config (user_id, row_count, col_count)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         row_count = VALUES(row_count),
         col_count = VALUES(col_count)`,
      [userId, Number(rows), Number(columns)],
    );

    const [rowsResult] = await db.query(
      "SELECT row_count, col_count FROM grid_config WHERE user_id = ?",
      [userId],
    );

    const row = rowsResult[0];
    const grid = row
      ? { rows: row.row_count, columns: row.col_count }
      : { rows: 0, columns: 0 };

    return res.json(grid);
  } catch (err) {
    console.error("Grid save error:", err);
    return res.status(500).json({ message: "Could not save grid" });
  }
};

// Get the current user's grid configuration
exports.getGrid = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rowsResult] = await db.query(
      "SELECT row_count, col_count FROM grid_config WHERE user_id = ?",
      [userId],
    );

    const row = rowsResult[0];
    const grid = row
      ? { rows: row.row_count, columns: row.col_count }
      : { rows: 0, columns: 0 };

    return res.json(grid);
  } catch (err) {
    console.error("Grid fetch error:", err);
    return res.status(500).json({ message: "Could not fetch grid" });
  }
};
