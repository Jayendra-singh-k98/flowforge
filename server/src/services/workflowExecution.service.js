const { executeNode } = require("./nodeExecutor");

const getStartNode = (workflow) => {
    const targetNodeIds = new Set(workflow.edges.map((edge) => edge.target));

    return workflow.nodes.find((node) => !targetNodeIds.has(node.id));
};

const getNextNodes = (workflow, node, output) => {
    const outgoingEdges = workflow.edges.filter((edge) => edge.source === node.id);

    let selectedEdges = outgoingEdges;

    const nodeType = node.config?.nodeType || node.type;

    // Condition nodes choose only one branch
    if (nodeType === "condition") {
        const conditionResult = output?.result;

        const expectedHandle = conditionResult ? "true" : "false";

        selectedEdges = outgoingEdges.filter((edge) => edge.sourceHandle === expectedHandle);
    }

    return selectedEdges.map((edge) => workflow.nodes.find((workflowNode) => workflowNode.id === edge.target)).filter(Boolean);
};

const executeWorkflow = async (workflow, execution) => {
    const startNode = getStartNode(workflow);

    if (!startNode) {
        throw new Error("Workflow does not have a start node");
    }

    let currentNodes = [startNode];
    let input = {};

    while (currentNodes.length > 0) {
        const nextNodes = [];

        for (const node of currentNodes) {
            const nodeExecution = execution.nodeExecutions.find(
                (item) => item.nodeId === node.id
            );

            if (!nodeExecution) {
                throw new Error(
                    `Execution record not found for node ${node.id}`
                );
            }

            // Retry safety: if this node already completed on a previous
            // attempt, don't re-run it (avoids re-sending emails / re-firing
            // HTTP requests on retry). Just propagate its stored output
            // forward so downstream nodes still get the right input.
            if (nodeExecution.status === "completed") {
                console.log(`Skipping already-completed node: ${node.id}`);

                const children = getNextNodes(workflow, node, nodeExecution.output);
                nextNodes.push(...children);
                input = nodeExecution.output;
                continue;
            }

            console.log(`Executing node: ${node.id}`);

            nodeExecution.status = "running";
            nodeExecution.startedAt = new Date();
            nodeExecution.input = input;

            await execution.save();

            try {
                const output = await executeNode(node, input);

                nodeExecution.status = "completed";
                nodeExecution.completedAt = new Date();
                nodeExecution.output = output;

                await execution.save();

                console.log(`Node ${node.id} completed successfully`);

                const children = getNextNodes(workflow, node, output);

                nextNodes.push(...children);

                input = output;
            } catch (error) {
                nodeExecution.status = "failed";
                nodeExecution.completedAt = new Date();
                nodeExecution.error = error.message;

                await execution.save();

                throw error;
            }
        }

        currentNodes = nextNodes;
    }

    return execution;
};

module.exports = { getStartNode, getNextNodes, executeWorkflow,};