const { z } = require("zod");

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Node-type-specific config shapes, matching what the frontend
// editor and nodeExecutor.js actually read.
const httpConfigSchema = z.object({
  nodeType: z.literal("http").optional(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]).default("GET"),
  url: z.string().trim().min(1, "HTTP URL is required").url("Must be a valid URL"),
  body: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

const emailConfigSchema = z.object({
  nodeType: z.literal("email").optional(),
  to: z.string().trim().email("Recipient must be a valid email"),
  subject: z.string().trim().min(1, "Email subject is required"),
  body: z.string().trim().min(1, "Email body is required"),
});

const conditionConfigSchema = z.object({
  nodeType: z.literal("condition").optional(),
  field: z.string().trim().min(1, "Condition field is required"),
  operator: z.enum(["equals", "not_equals", "greater_than", "less_than", "contains"]),
  value: z.union([z.string(), z.number()]),
});

const triggerConfigSchema = z.object({
  nodeType: z.literal("trigger").optional(),
  triggerType: z.enum(["manual", "webhook", "schedule"]).default("manual"),
}).passthrough(); // schedule/webhook may carry extra fields later

// config is validated loosely at the schema level (Mixed in Mongoose),
// so we check its shape conditionally based on nodeType inside a
// superRefine rather than a discriminated union — keeps this
// resilient if a node's config is briefly incomplete mid-edit.
const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["trigger", "action", "condition"]), // matches Workflow.js model, not frontend React Flow types
  name: z.string().trim().min(1).optional(),
  position: positionSchema.optional(),
  config: z.record(z.string(), z.any()).optional(),
}).superRefine((node, ctx) => {
  const config = node.config ?? {};
  // For "action" nodes, the specific kind (http/email) lives in config.nodeType.
  // Trigger and condition nodes use node.type directly.
  const nodeType = config.nodeType || node.type;

  const schemaByType = {
    http: httpConfigSchema,
    email: emailConfigSchema,
    condition: conditionConfigSchema,
    trigger: triggerConfigSchema,
  };

  const configSchema = schemaByType[nodeType];
  if (!configSchema) return;

  const result = configSchema.safeParse(config);
  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Node "${node.id}" (${nodeType}): ${issue.message}`,
        path: ["config", ...issue.path],
      });
    }
  }
});

const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
  target: z.string().min(1),
  targetHandle: z.string().nullable().optional(),
});

const createWorkflowSchema = z.object({
  name: z.string().trim().min(1, "Workflow name is required").max(100),
  trigger: z.object({
    type: z.enum(["manual", "webhook", "schedule"]),
    config: z.record(z.string(), z.any()).optional(),
  }),
  nodes: z.array(nodeSchema).optional().default([]),
  edges: z.array(edgeSchema).optional().default([]),
});

const updateWorkflowSchema = z.object({
  name: z.string().trim().min(1, "Workflow name cannot be empty").max(100).optional(),
  trigger: z.object({
    type: z.enum(["manual", "webhook", "schedule"]),
    config: z.record(z.string(), z.any()).optional(),
  }).optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(edgeSchema).optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["draft", "active", "paused"], {
    errorMap: () => ({ message: "Status must be one of: draft, active, paused" }),
  }),
});

module.exports = {
  createWorkflowSchema,
  updateWorkflowSchema,
  updateStatusSchema,
  nodeSchema,
  edgeSchema,
};