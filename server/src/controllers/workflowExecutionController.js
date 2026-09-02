const Workflow = require("../models/Workflow");
const WorkflowExecution = require("../models/WorkflowExecution");
const workflowQueue = require("../queues/workflowQueue");

const executeWorkflow = async (req, res) => {
    try {
        const workflowId = req.params.id;
        const userId = req.user._id;

        const workflow = await Workflow.findOne({ _id: workflowId, userId: userId });

        if (!workflow) {
            return res.status(404).json({ success: false, message: "Workflow not found", });
        }

        if (workflow.status === "paused") {
            return res.status(400).json({ success: false, message: "Workflow is paused", });
        }

        // Create execution record
        const execution = await WorkflowExecution.create({
            workflowId: workflow._id,
            userId: req.user._id,
            status: "pending",
            nodeExecutions: [],
        });


        const job = await workflowQueue.add("execute-workflow", { executionId: execution._id.toString(), });

        return res.status(201).json({
            success: true,
            message: "Workflow execution created successfully",
            data: {
                execution: {
                    id: execution._id,
                    workflowId: execution.workflowId,
                    status: execution.status,
                    jobId: job.id,
                    createdAt: execution.createdAt,
                },
            },
        });

        execution.status = "queued";    
        await execution.save();

    } catch (error) {
        console.error("Execute workflow error:", error);
        if (error.name === "CastError") {
            return res.status(400).json({ success: false, message: "Invalid workflow ID", });
        }
        return res.status(500).json({ success: false, message: "Failed to execute workflow", });
    }
};

const getWorkflowExecution = async (req, res) => {
    try {
        const executionId = req.params.id;

        const execution = await WorkflowExecution.findOne({
            _id: executionId,
            userId: req.user._id,
        });

        if (!execution) {
            return res.status(404).json({
                success: false,
                message: "Workflow execution not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                execution,
            },
        });

    } catch (error) {
        console.error(
            "Get workflow execution error:",
            error
        );

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid execution ID",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to get workflow execution",
        });
    }
};

module.exports = { executeWorkflow, getWorkflowExecution, };