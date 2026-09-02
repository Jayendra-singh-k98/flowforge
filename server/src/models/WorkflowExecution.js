const mongoose = require("mongoose");

const nodeExecutionSchema = new mongoose.Schema(
    {
        nodeId: { type: String, required: true},
        nodeType: { type: String, required: true},
        status: {type: String,
            enum: [
                "pending",
                "running",
                "completed",
                "failed",
            ],
            default: "pending",
        },
        startedAt: { type: Date, default: null,},
        completedAt: { type: Date, default: null,},
        input: {type: mongoose.Schema.Types.Mixed, default: {} },
        output: { type: mongoose.Schema.Types.Mixed, default: {},},
        error: { type: String, default: null,},
        retryCount: { type: Number, default: 0,},
    },
    {
        _id: false,
    }
);


const workflowExecutionSchema = new mongoose.Schema(
    {
        workflowId: {type: mongoose.Schema.Types.ObjectId, ref: "Workflow", required: true, index: true, },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true,},
        status: { type: String,
            enum: [
                "pending",
                "queued",
                "running",
                "completed",
                "failed",
            ],
            default: "pending",
        },
        startedAt: { type: Date, default: null,},
        completedAt: { type: Date, default: null,},
        nodeExecutions: { type: [nodeExecutionSchema], default: [],},
        error: {type: String, default: null,},
    },
    {
        timestamps: true,
    }
);

workflowExecutionSchema.index({ workflowId: 1, createdAt: -1,});

workflowExecutionSchema.index({ userId: 1, createdAt: -1,});

module.exports = mongoose.model("WorkflowExecution", workflowExecutionSchema);