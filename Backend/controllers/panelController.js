const Panel = require("../models/Panel");

// POST /api/user/panels
exports.createPanel = async (req, res) => {
  try {
    const owner = req.user._id;
    const panel = await Panel.create({ ...req.body, owner });
    return res.status(201).json(panel);
  } catch (err) {
    console.error("Panel create error:", err);
    return res.status(500).json({ message: "Could not save panel" });
  }
};

// GET /api/user/panels
exports.listPanels = async (req, res) => {
  try {
    const owner = req.user._id;
    const panels = await Panel.find({ owner });
    return res.json(panels);
  } catch (err) {
    console.error("Panel list error:", err);
    return res.status(500).json({ message: "Could not fetch panels" });
  }
};

// PATCH /api/user/panels/:id
exports.updatePanel = async (req, res) => {
  try {
    const owner = req.user._id;
    const panel = await Panel.findOneAndUpdate(
      { _id: req.params.id, owner },
      req.body,
      { new: true }
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
  const owner = req.user._id;
  const startIndex = parseInt(req.query.startIndex, 10) || 0;
  const count = parseInt(req.query.count, 10) || 100;

  try {
    const panels = await Panel.find({ owner })
      .skip(startIndex)
      .limit(count)
      .exec();
    return res.json(panels);
  } catch (err) {
    console.error("Panel batch error:", err);
    return res.status(500).json({ message: "Could not fetch panel batch" });
  }
};

// GET /api/user/panels/fault-level?level=low
exports.listPanelsByFaultLevel = async (req, res) => {
  const owner = req.user._id;
  const level = req.query.level;
  if (!level) return res.status(400).json({ message: "Missing level" });

  try {
    const panels = await Panel.find({
      owner,
      "currentFault.level": level,
    }).exec();
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
  const owner = req.user._id;
  const term = req.query.id;
  if (!term) return res.status(400).json({ message: "Missing id" });

  try {
    const regex = new RegExp(term, "i");
    const panels = await Panel.find({ owner, id: regex }).exec();
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
    const owner = req.user._id;
    // attach owner to each panel
    const docs = req.body.panels.map((p) => ({ ...p, owner }));
    const created = await Panel.insertMany(docs);
    res.status(201).json(created);
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
      ...inspectionData
    });

    // Update current fault if provided
    if (inspectionData.currentFault) {
      panel.currentFault = inspectionData.currentFault;
    }

    // Save the updated panel
    await panel.save();
    
    return res.status(200).json({ message: "Inspection data backed up successfully" });
  } catch (err) {
    console.error("Inspection backup error:", err);
    return res.status(500).json({ message: "Could not backup inspection data" });
  }
};

// GET /api/panels/backup-data
exports.getBackupData = async (req, res) => {
  try {
    const panels = await Panel.find({}, {
      id: 1,
      inspectionHistory: 1,
      currentFault: 1,
      lastInspection: 1,
      _id: 0
    });
    
    return res.json(panels);
  } catch (err) {
    console.error("Error fetching backup data:", err);
    return res.status(500).json({ message: "Could not fetch backup data" });
  }
};
