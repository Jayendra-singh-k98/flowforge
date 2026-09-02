require("dotenv").config();

const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const WorkflowExecution = require("../models/WorkflowExecution");
const Worklfow = require("../models/Workflow");
const { executeWorkflow, } = require("../services/workflowExecution.service");

const workflowWorker = new Worker("workflow-execution", async (job) => {

    console.log("Processing workflow job:", job.id);

    const { executionId } = job.data;

    try {
        // Find execution in MongoDB
        const execution = await WorkflowExecution.findById(executionId);
        if (!execution) {
            throw new Error("Workflow execution not found");
        }

        const workflow = await Workflow.findById(execution.workflowId);
        if (!workflow) {
            throw new Error("Workflow not found");
        }

        execution.nodeExecutions = workflow.nodes.map((node) => ({
                nodeId: node.id,
                nodeType: node.config?.nodeType || node.type,
                status: "pending",
                input: {},
                output: {},
                retryCount: 0,
            })
        );

        await execution.save();

        // Update status to running
        execution.status = "running";
        execution.startedAt = new Date();
        await execution.save();
        console.log(`Workflow execution ${executionId} started`);

        await executeWorkflow(workflow, execution);
        execution.status = "completed";
        execution.completedAt = new Date();
        await execution.save();
        console.log(`Workflow execution ${executionId} completed`);

        return { success: true, executionId, };

    } catch (error) {
        console.error("Workflow execution failed:", error.message);
        // Update execution as failed
        await WorkflowExecution.findByIdAndUpdate(
            executionId,
            {
                status: "failed",
                completedAt: new Date(),
                error: error.message,
            }
        );
        throw error;
    }
},
    {
        connection: redisConnection,
    }
);

workflowWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
}
);

workflowWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
}
);

console.log("Workflow Worker is running...");