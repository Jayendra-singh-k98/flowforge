const express = require("express");

const { createWorkflow, getWorkflows, getWorkflowById, updateWorkflow, deleteWorkflow, updateWorkflowStatus } = require("../controllers/workflowController");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { createWorkflowSchema, updateWorkflowSchema, updateStatusSchema } = require("../validators/workflowValidators");

const router = express.Router();

router.post("/", protect, validate(createWorkflowSchema), createWorkflow);
router.get("/", protect, getWorkflows);
router.get("/:id", protect, getWorkflowById);
router.patch("/:id", protect, validate(updateWorkflowSchema), updateWorkflow);
router.delete("/:id", protect, deleteWorkflow);
router.patch("/:id/status", protect, validate(updateStatusSchema), updateWorkflowStatus);


module.exports = router;