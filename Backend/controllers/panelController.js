const db = require("../config/db");

// Helper to map a panels table row into the frontend Panel shape
function mapPanelRow(row) {
  return {
    id: row.panel_id,
    Model: row.model ? Number(row.model) : 0,
    installationDate: row.installation_date
      ? new Date(row.installation_date).toISOString().slice(0, 10)
      : "",
    position: { row: row.row_index, column: row.col_index },
    companyName: row.company_name || "Solar Corp",
    size: {
      width: row.size_width !== null ? row.size_width : 1.2,
      height: row.size_height !== null ? row.size_height : 0.8,
    },
    maxOutput: row.max_output !== null ? row.max_output : 0,
    currentOutput: row.current_output !== null ? row.current_output : 0,
    lastInspection: null,
    inspectionHistory: [],
    currentFault: {
      description: row.current_fault_description || "No issues detected",
      level: row.current_fault_level || "none",
    },
    priority: row.priority || "low",
    maintenanceSuggestion:
      row.maintenance_suggestion || "No maintenance needed",
    image: row.image || undefined,
    createdBy: undefined,
  };
}

// Helper to normalize fault level from description
function getLevelFromDescription(description) {
  const desc = (description || "").toLowerCase().replace(/-/g, " ");
  if (desc.includes("physical damage")) return "high";
  if (
    desc.includes("dust") ||
    desc.includes("bird") ||
    desc.includes("drop") ||
    desc.includes("snow")
  ) {
    return "medium";
  }
  if (
    desc.includes("clean") ||
    desc.includes("no faults") ||
    desc.includes("healthy")
  ) {
    return "low";
  }
  return null;
}

// POST /api/user/panels
exports.createPanel = async (req, res) => {
  try {
    const userId = req.user.id;
    const p = req.body;

    await db.query(
      `INSERT INTO panels (
        panel_id, user_id, row_index, col_index, company_name, model,
        size_width, size_height, installation_date, max_output, current_output,
        priority, maintenance_suggestion, current_fault_description, current_fault_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        userId,
        p.position?.row ?? 0,
        p.position?.column ?? 0,
        p.companyName || null,
        p.Model != null ? String(p.Model) : null,
        p.size?.width ?? null,
        p.size?.height ?? null,
        p.installationDate ? p.installationDate.substring(0, 10) : null,
        p.maxOutput ?? null,
        p.currentOutput ?? null,
        p.priority || "low",
        p.maintenanceSuggestion || null,
        p.currentFault?.description || "No issues detected",
        p.currentFault?.level || "none",
      ],
    );

    const [rows] = await db.query(
      "SELECT * FROM panels WHERE panel_id = ? AND user_id = ?",
      [p.id, userId],
    );

    return res.status(201).json(mapPanelRow(rows[0]));
  } catch (err) {
    console.error("Panel create error:", err);
    return res.status(500).json({ message: "Could not save panel" });
  }
};

// GET /api/user/panels
exports.listPanels = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      "SELECT * FROM panels WHERE user_id = ? ORDER BY row_index, col_index",
      [userId],
    );

    const panels = rows.map(mapPanelRow);
    return res.json(panels);
  } catch (err) {
    console.error("Panel list error:", err);
    return res.status(500).json({ message: "Could not fetch panels" });
  }
};

// POST /api/panels/detection-update
// Called directly from the Python detection scripts (no auth)
exports.updatePanelFromDetection = async (req, res) => {
  try {
    const { panelId, faults, level, image } = req.body;

    if (!panelId) {
      return res.status(400).json({ message: "panelId is required" });
    }

    const normalizedLevel = getLevelFromDescription(faults) || level || "none";

    // Map fault level into a simple priority string
    let priority = "low";
    if (normalizedLevel === "high") priority = "high";
    else if (normalizedLevel === "medium") priority = "medium";
    else if (normalizedLevel === "low") priority = "low";

    const [result] = await db.query(
      `UPDATE panels
       SET current_fault_description = ?,
           current_fault_level = ?,
           priority = ?,
           image = COALESCE(?, image),
           updated_at = CURRENT_TIMESTAMP
       WHERE panel_id = ?`,
      [
        faults || "No issues detected",
        normalizedLevel,
        priority,
        image || null,
        panelId,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Panel not found" });
    }

    const [rows] = await db.query("SELECT * FROM panels WHERE panel_id = ?", [
      panelId,
    ]);
    const panelRow = rows[0];
    return res.json(mapPanelRow(panelRow));
  } catch (err) {
    console.error("Detection update error:", err);
    return res
      .status(500)
      .json({ message: "Could not update panel from detection" });
  }
};

// PATCH /api/user/panels/:id
exports.updatePanel = async (req, res) => {
  try {
    const owner = req.user._id;
    const panel = await Panel.findOneAndUpdate(
      { _id: req.params.id, owner },
      req.body,
      { new: true },
    );
    if (!panel) return res.status(404).json({ message: "Panel not found" });
    return res.json(panel);
  } catch (err) {
    console.error("Panel update error:", err);
    return res.status(500).json({ message: "Could not update panel" });
  }
};

exports.getPanelById = async (req, res) => {
  try {
    const panel = await Panel.findById(req.params.id);

    if (!panel) {
      return res.status(404).json({ message: "Panel not found" });
    }
    res.json(panel);
  } catch (error) {
    console.error("Error fetching panel by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/user/panels/:id
exports.deletePanel = async (req, res) => {
  try {
    const owner = req.user._id;
    const result = await Panel.findOneAndDelete({ _id: req.params.id, owner });
    if (!result) return res.status(404).json({ message: "Panel not found" });
    return res.json({ message: "Panel deleted" });
  } catch (err) {
    console.error("Panel delete error:", err);
    return res.status(500).json({ message: "Could not delete panel" });
  }
};

// GET /api/user/panels/batch?startIndex=&count=
exports.listPanelsBatch = async (req, res) => {
  const userId = req.user.id;
  const startIndex = parseInt(req.query.startIndex, 10) || 0;
  const count = parseInt(req.query.count, 10) || 100;

  try {
    const [rows] = await db.query(
      "SELECT * FROM panels WHERE user_id = ? ORDER BY row_index, col_index LIMIT ? OFFSET ?",
      [userId, count, startIndex],
    );
    const panels = rows.map(mapPanelRow);
    return res.json(panels);
  } catch (err) {
    console.error("Panel batch error:", err);
    return res.status(500).json({ message: "Could not fetch panel batch" });
  }
};

// GET /api/user/panels/fault-level?level=low
exports.listPanelsByFaultLevel = async (req, res) => {
  const userId = req.user.id;
  const level = req.query.level;
  if (!level) return res.status(400).json({ message: "Missing level" });

  try {
    const [rows] = await db.query(
      "SELECT * FROM panels WHERE user_id = ? AND current_fault_level = ? ORDER BY row_index, col_index",
      [userId, level],
    );
    const panels = rows.map(mapPanelRow);
    return res.json(panels);
  } catch (err) {
    console.error("Panel fault‐level error:", err);
    return res
      .status(500)
      .json({ message: "Could not fetch panels by fault level" });
  }
};

// GET /api/user/panels/search?id=Panel-123
exports.searchPanelsById = async (req, res) => {
  const userId = req.user.id;
  const term = req.query.id;
  if (!term) return res.status(400).json({ message: "Missing id" });

  try {
    const like = `%${term}%`;
    const [rows] = await db.query(
      "SELECT * FROM panels WHERE user_id = ? AND panel_id LIKE ? ORDER BY row_index, col_index",
      [userId, like],
    );
    const panels = rows.map(mapPanelRow);
    return res.json(panels);
  } catch (err) {
    console.error("Panel search error:", err);
    return res.status(500).json({ message: "Could not search panels" });
  }
};

// Controller (panelCtrl.js)
// controllers/panelController.js
exports.bulkCreatePanels = async (req, res) => {
  try {
    const userId = req.user.id;
    const panels = req.body.panels;

    if (!Array.isArray(panels)) {
      return res
        .status(400)
        .json({ message: "panels must be an array in request body" });
    }

    if (panels.length === 0) {
      return res.status(200).json({ message: "No panels to process" });
    }

    const values = panels.map((p) => [
      p.id,
      userId,
      p.position?.row ?? 0,
      p.position?.column ?? 0,
      p.companyName || null,
      p.Model != null ? String(p.Model) : null,
      p.size?.width ?? null,
      p.size?.height ?? null,
      p.installationDate ? p.installationDate.substring(0, 10) : null,
      p.maxOutput ?? null,
      p.currentOutput ?? null,
      p.priority || "low",
      p.maintenanceSuggestion || null,
      p.currentFault?.description || "No issues detected",
      p.currentFault?.level || "none",
    ]);

    const sql = `
      INSERT INTO panels (
        panel_id, user_id, row_index, col_index, company_name, model,
        size_width, size_height, installation_date, max_output, current_output,
        priority, maintenance_suggestion, current_fault_description, current_fault_level
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        row_index = VALUES(row_index),
        col_index = VALUES(col_index),
        company_name = VALUES(company_name),
        model = VALUES(model),
        size_width = VALUES(size_width),
        size_height = VALUES(size_height),
        installation_date = VALUES(installation_date),
        max_output = VALUES(max_output),
        current_output = VALUES(current_output),
        priority = VALUES(priority),
        maintenance_suggestion = VALUES(maintenance_suggestion),
        current_fault_description = VALUES(current_fault_description),
        current_fault_level = VALUES(current_fault_level)
    `;

    await db.query(sql, [values]);

    return res
      .status(201)
      .json({ message: "Panels inserted/updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create panels" });
  }
};

// POST /api/panels/backup-inspection
exports.backupInspectionData = async (req, res) => {
  try {
    const { panelId, inspectionData } = req.body;

    // Find the panel and update its inspection history
    const panel = await Panel.findOne({ id: panelId });

    if (!panel) {
      return res.status(404).json({ message: "Panel not found" });
    }

    // Add the new inspection data to the history
    panel.inspectionHistory.push({
      date: new Date(),
      ...inspectionData,
    });

    // Update current fault if provided
    if (inspectionData.currentFault) {
      panel.currentFault = inspectionData.currentFault;
    }

    // Save the updated panel
    await panel.save();

    return res
      .status(200)
      .json({ message: "Inspection data backed up successfully" });
  } catch (err) {
    console.error("Inspection backup error:", err);
    return res
      .status(500)
      .json({ message: "Could not backup inspection data" });
  }
};

// GET /api/panels/backup-data
exports.getBackupData = async (req, res) => {
  try {
    const panels = await Panel.find(
      {},
      {
        id: 1,
        inspectionHistory: 1,
        currentFault: 1,
        lastInspection: 1,
        _id: 0,
      },
    );

    return res.json(panels);
  } catch (err) {
    console.error("Error fetching backup data:", err);
    return res.status(500).json({ message: "Could not fetch backup data" });
  }
};
