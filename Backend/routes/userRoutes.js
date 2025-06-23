const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const gridCtrl = require("../controllers/gridController");
const panelCtrl = require("../controllers/panelController");

// Grid endpoints
router.post("/grid", authMiddleware, gridCtrl.createOrUpdateGrid);
router.get("/grid", authMiddleware, gridCtrl.getGrid);

// Panel endpoints
router.post("/panels", authMiddleware, panelCtrl.createPanel);
router.get("/panels", authMiddleware, panelCtrl.listPanels);
router.get("/panels/:id", panelCtrl.getPanelById);
router.patch("/panels/:id", authMiddleware, panelCtrl.updatePanel);
router.delete("/panels/:id", authMiddleware, panelCtrl.deletePanel);

router.post("/panels/bulk", authMiddleware, panelCtrl.bulkCreatePanels);

// Batch, filter, search
router.get("/panels/batch", authMiddleware, panelCtrl.listPanelsBatch);
router.get(
  "/panels/fault-level",
  authMiddleware,
  panelCtrl.listPanelsByFaultLevel
);
router.get("/panels/search", authMiddleware, panelCtrl.searchPanelsById);

// Backup inspection data
router.post(
  "/panels/backup-inspection",
  authMiddleware,
  panelCtrl.backupInspectionData
);

// View backup data
router.get("/panels/backup-data", authMiddleware, panelCtrl.getBackupData);

module.exports = router;
