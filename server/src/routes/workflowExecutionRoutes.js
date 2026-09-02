const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const { executeWorkflow, getWorkflowExecution } = require("../controllers/workflowExecutionController");

router.post("/workflows/:id/execute", protect, executeWorkflow);
router.get("/workflow-executions/:id", protect, getWorkflowExecution);
module.exports = router;
