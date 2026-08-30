export const validateWorkflow = ( nodes, edges ) => {
  const errors = [];

  if (!nodes || nodes.length === 0) {
    errors.push("Workflow must contain at least one node.");
    return errors;
  }

  const triggers = nodes.filter((node) => node.type === "trigger");

  if (triggers.length === 0) {
    errors.push("Workflow must contain a trigger.");
  }

  if (triggers.length > 1) {
    errors.push("Workflow can contain only one trigger.");
  }

  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push(`Invalid edge: ${edge.source} → ${edge.target}`);
    }
  }

  const triggerIds = new Set(triggers.map((node) => node.id));

  for (const edge of edges) {
    if (triggerIds.has(edge.target)) {
      errors.push("Trigger cannot have an incoming connection.");
    }
  }

  for (const node of nodes) {
    const config = node.data?.config || {};

    if (node.type === "http") {
      if (!config.url?.trim()) {
        errors.push(`HTTP Request "${node.data?.label}" requires a URL.`);
      }
    }

    if (node.type === "email") {
      if (!config.to?.trim()) {
        errors.push(`Email "${node.data?.label}" requires a recipient.`);
      }
    }

    if (node.type === "condition") {
      if (!config.field?.trim()) {
        errors.push(`Condition "${node.data?.label}" requires a field.`);
      }

      if (!config.value?.trim()) {
        errors.push(`Condition "${node.data?.label}" requires a value.`);
      }
    }
  }

  return [...new Set(errors)];
};