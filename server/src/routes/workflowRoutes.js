const express = require("express");

const { createWorkflow, getWorkflows, getWorkflowById, updateWorkflow, deleteWorkflow } = require("../controllers/workflowController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createWorkflow);
router.get("/", protect, getWorkflows);
router.get("/:id", protect, getWorkflowById);
router.patch("/:id", protect, updateWorkflow);
router.delete("/:id", protect, deleteWorkflow);

module.exports = router;