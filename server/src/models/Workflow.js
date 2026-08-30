const mongoose = require("mongoose");

const workflowNodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true},

    type: { type: String, required: true, enum: [ "trigger", "action", "condition", ], },

    name: { type: String, required: true, trim: true },

    position: {
      x: { type: Number, required: true, default: 0, },
      y: { type: Number, required: true, default: 0, },
    },

    config: { type: mongoose.Schema.Types.Mixed, default: {}, },
  },
  {
    _id: false,
  }
);

const workflowEdgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, },

    source: { type: String, required: true, },

    target: { type: String, required: true, },
  },
  {
    _id: false,
  }
);

const workflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100, },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true, },

    status: { type: String, enum: ["draft", "active", "paused"], default: "draft" },

    trigger: { type: { type: String, enum: [ "manual", "webhook", "schedule", ], required: true, },
                config: { type: mongoose.Schema.Types.Mixed, default: {}, },
            },

    nodes: { type: [workflowNodeSchema], default: [], },

    edges: { type: [workflowEdgeSchema], default: [], },
  },
  {
    timestamps: true,
  }
);

workflowSchema.index({ userId: 1, createdAt: -1, });

module.exports = mongoose.model( "Workflow", workflowSchema );