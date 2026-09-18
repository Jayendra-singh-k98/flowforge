require("dotenv").config();

const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const Workflow = require("../models/Workflow");
const WorkflowExecution = require("../models/WorkflowExecution");
const { executeWorkflow } = require("../services/workflowExecution.service");

const workflowWorker = new Worker("workflow-execution", async (job) => {
    const attemptNumber = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts || 1;

    console.log( `Processing workflow job: ${job.id}, attempt ${attemptNumber}/${maxAttempts}`);

    const { executionId } = job.data;
    const execution = await WorkflowExecution.findById(executionId);

    if (!execution) {
      throw new Error("Workflow execution not found");
    }

    const workflow = await Workflow.findOne({
      _id: execution.workflowId,
      userId: execution.userId,
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    try {
      if (execution.nodeExecutions.length === 0) {
        execution.nodeExecutions = workflow.nodes.map((node) => ({
          nodeId: node.id,
          nodeType: node.config?.nodeType || node.type,
          status: "pending",
        }));
      }

      execution.status = "running";
      execution.retryCount = job.attemptsMade;
      execution.startedAt = execution.startedAt || new Date();
      execution.error = null;
      await execution.save();
      await executeWorkflow(workflow, execution);

      execution.status = "completed";
      execution.completedAt = new Date();
      execution.error = null;
      await execution.save();

      console.log( `Workflow execution ${executionId} completed`);

      return {
        success: true,
        executionId,
      };
    } catch (error) {
      console.error(`Workflow execution ${executionId} failed on attempt ${attemptNumber}:`, error.message);

      execution.retryCount = job.attemptsMade;
      execution.error = error.message;
      await execution.save();
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

workflowWorker.on("completed", (job) => {
  console.log(
    `Job ${job.id} completed successfully`
  );
});

workflowWorker.on("failed", async (job, error) => {
  if (!job) return;

  const maxAttempts = job.opts.attempts || 1;
  const retryCount = job.attemptsMade;
  const isFinalAttempt = retryCount >= maxAttempts;

  console.error(`Job ${job.id} failed:`, error.message);

  try {
    const executionId = job.data.executionId;

    await WorkflowExecution.findByIdAndUpdate(
      executionId,
      {
        retryCount,
        error: error.message,
        ...(isFinalAttempt
          ? {
              status: "failed",
              completedAt: new Date(),
            }
          : {}),
      }
    );

    if (isFinalAttempt) {
      console.error( `Workflow execution ${executionId} permanently failed`);
    }
  } catch (updateError) {
    console.error("Failed to update execution after job failure:", updateError.message);
  }
});

workflowWorker.on("error", (error) => {
  console.error("Workflow worker error:", error.message);
});

console.log("Workflow Worker is running...");