require("dotenv").config();

const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const Workflow = require("../models/Workflow");
const WorkflowExecution = require("../models/WorkflowExecution");

const { executeWorkflow, } = require("../services/workflowExecution.service");


const workflowWorker = new Worker("workflow-execution", async (job) => {

    console.log( `Processing workflow job: ${job.id}, attempt: ${job.attemptsMade + 1}`);

    const { executionId } = job.data;
    const execution = await WorkflowExecution.findById(executionId);

    if (!execution) {
      throw new Error( "Workflow execution not found");
    }

    const workflow = await Workflow.findOne({
        _id: execution.workflowId,
        userId: execution.userId,
      });

    if (!workflow) {
      throw new Error( "Workflow not found");
    }

    try {

      if (
        execution.nodeExecutions.length === 0
      ) {
        execution.nodeExecutions = workflow.nodes.map((node) => ({
            nodeId: node.id,
            nodeType: node.config?.nodeType || node.type,
            status: "pending",
          }));
      }


      execution.status = "running";
      execution.startedAt = execution.startedAt || new Date();
      execution.error = null;
      await execution.save();

      /* Execute the workflow */
      await executeWorkflow( workflow, execution);

      /* Workflow completed*/
      execution.status = "completed";
      execution.completedAt = new Date();
      execution.error = null;
      await execution.save();

      console.log( `Workflow execution ${executionId} completed`);

      return { success: true, executionId,};
    } catch (error) {

      console.error(`Workflow execution ${executionId} failed:`, error.message);


      /* Do not permanently mark the execution as failed yet.
       *BullMQ may retry this job.
       */
      execution.error = error.message;
      await execution.save();
      throw error;
    }
  },
  {
    connection: redisConnection,
    /*
     * Worker-level concurrency.
     * Start small for the MVP.
     */
    concurrency: 5,
  }
);


workflowWorker.on("completed", (job) => {
    console.log( `Job ${job.id} completed successfully`);
  }
);


workflowWorker.on( "failed", async (job, error) => {
     if (!job) return;

    console.error( `Job ${job.id} failed:`, error.message);

    /*
     * BullMQ calls this event after an attempt.
     * Only mark the workflow permanently failed
     * when no attempts remain.
     */
    if (job.attemptsMade >= job.opts.attempts) {
      const executionId = job.data.executionId;

      await WorkflowExecution.findByIdAndUpdate( executionId,
        {
          status: "failed",
          completedAt: new Date(),
          error: error.message,
        }
      );

      console.error( `Workflow execution ${executionId} permanently failed`);
    }
  }
);

workflowWorker.on( "error", (error) => {
    console.error("Workflow worker error:", error.message);
  }
);

console.log("Workflow Worker is running...");