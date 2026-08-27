export const serializeNodes = (nodes) => {
  return nodes.map((node) => ({
    id: node.id,

    type: node.type === "trigger" ? "trigger" : node.type === "condition" ? "condition" : "action",

    name: node.data?.label || node.type,

    position: {
      x: node.position?.x || 0,
      y: node.position?.y || 0,
    },

    config: {
      nodeType: node.type, ...(node.data?.config || {}),
    },
  }));
};

export const serializeEdges = (edges) => {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }));
};