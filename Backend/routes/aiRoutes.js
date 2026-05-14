const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");

router.get(
  "/panels/:panelId/context",
  authMiddleware,
  aiController.getPanelContext,
);
router.post("/chat", authMiddleware, aiController.chatWithContext);
router.post("/diagnosis-plan", authMiddleware, aiController.generateRepairPlan);

module.exports = router;
