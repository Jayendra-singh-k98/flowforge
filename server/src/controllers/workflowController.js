const Workflow = require("../models/Workflow");
const { validateWorkflow, } = require("../services/workflowValidator");

const createWorkflow = async (req, res) => {
  try {
    const { name, description, trigger, nodes, edges, } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Workflow name is required",
      });
    }

    if (!trigger || !trigger.type) {
      return res.status(400).json({
        success: false,
        message: "Workflow trigger is required",
      });
    }

    const workflow = await Workflow.create({
      name,
      description,
      userId: req.user._id,
      trigger,
      nodes: nodes || [],
      edges: edges || [],
      status: "draft",
    });

    return res.status(201).json({
      success: true,
      message: "Workflow created successfully",
      data: {
        workflow,
      },
    });
  } catch (error) {
    console.error("Create workflow error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({
      userId: req.user._id,
    }).sort({
      createdAt: -1,
    });


    return res.status(200).json({
      success: true,
      data: {
        workflows,
      },
    });
  } catch (error) {
    console.error("Get workflows error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const mongoose = require("mongoose");
const getWorkflowById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      });
    }

    const workflow = await Workflow.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        workflow,
      },
    });
  } catch (error) {
    console.error("Get workflow error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      });
    }

    const workflow = await Workflow.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    const { name, description, trigger, nodes, edges, status, } = req.body;

    if (nodes !== undefined || edges !== undefined) {

      const workflowNodes = nodes !== undefined ? nodes : workflow.nodes;
      const workflowEdges = edges !== undefined ? edges : workflow.edges;

      const validationErrors = validateWorkflow(workflowNodes, workflowEdges);

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid workflow",
          errors: validationErrors,
        });
      }
    }

    if (name !== undefined) {
      if (
        typeof name !== "string" || name.trim().length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Workflow name cannot be empty",
        });
      }

      workflow.name = name.trim();
    }

    if (description !== undefined) {
      workflow.description = description;
    }

    if (trigger !== undefined) {
      workflow.trigger = trigger;
    }

    if (nodes !== undefined) {
      workflow.nodes = nodes;
    }

    if (edges !== undefined) {
      workflow.edges = edges;
    }

    if (status !== undefined) {
      if (
        !["draft", "active", "paused"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid workflow status",
        });
      }

      workflow.status = status;
    }

    await workflow.save();

    return res.status(200).json({
      success: true,
      message: "Workflow updated successfully",
      data: {
        workflow,
      },
    });
  } catch (error) {
    console.error("Update workflow error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      });
    }

    const workflow = await Workflow.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    await Workflow.deleteOne({
      _id: id,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Workflow deleted successfully",
    });
  } catch (error) {
    console.error("Delete workflow error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateWorkflowStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const allowedStatuses = [
      "draft",
      "active",
      "paused",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow status",
      });
    }

    const workflow = await Workflow.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    workflow.status = status;

    await workflow.save();

    return res.status(200).json({
      success: true,
      message: "Workflow status updated successfully",
      data: {
        workflow,
      },
    });
  } catch (error) {
    console.error("Update workflow status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { createWorkflow, getWorkflows, getWorkflowById, updateWorkflow, deleteWorkflow, updateWorkflowStatus, };