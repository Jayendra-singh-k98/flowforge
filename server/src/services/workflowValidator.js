const validateWorkflow = (nodes, edges) => {
  const errors = [];

  if (!Array.isArray(nodes) || nodes.length === 0) {
    errors.push(
      "Workflow must contain at least one node."
    );

    return errors;
  }

  if (!Array.isArray(edges)) {
    errors.push("Workflow edges must be an array.");
    return errors;
  }

  const triggers = nodes.filter(
    (node) => node.type === "trigger"
  );

  if (triggers.length === 0) {
    errors.push(
      "Workflow must contain a trigger."
    );
  }

  if (triggers.length > 1) {
    errors.push(
      "Workflow can contain only one trigger."
    );
  }

  const nodeIds = new Set(
    nodes.map((node) => node.id)
  );

  for (const edge of edges) {
    if (
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target)
    ) {
      errors.push(
        `Invalid edge: ${edge.source} → ${edge.target}`
      );
    }
  }

  return [...new Set(errors)];
};

module.exports = {
  validateWorkflow,
};