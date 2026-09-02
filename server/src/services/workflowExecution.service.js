const { executeNode } = require('./nodeExecutor');

const getStartNode = (workflow) => {
    const targetNodeIds = new Set(workflow.edges.map((edge) => edge.target));
    return workflow.nodes.find((node) => !targetNodeIds.has(node.id));
};

const getNextNodes = (workflow, nodeId, branch = null) => {
    let outgoingEdges = workflow.edges.filter((edge) => edge.source === nodeId);

    if (branch !== null) {
        outgoingEdges = outgoingEdges.filter((edge) => edge.sourceHandle === branch);
    }

    return outgoingEdges.map((edge) => workflow.nodes.find((node) => node.id === edge.target)).filter(Boolean);
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

            console.log(`Executing node: ${node.id}`);

            const nodeExecution = execution.nodeExecutions.find((item) => item.nodeId === node.id);
            if (!nodeExecution) {
                throw new Error(`Execution record not found for node ${node.id}`);
            }

            nodeExecution.status = "running";
            nodeExecution.startedAt = new Date();
            nodeExecution.input = input;
            await execution.save();

            try {
                const output = await executeNode(node, input);

                nodeExecution.status = "completed";
                nodeExecution.completedAt = new Date();
                nodeExecution.output = output;
                input = output;

                let children;

                const nodeType = node.config?.nodeType || node.type;

                if (nodeType === "condition") {
                    const branch = output.result ? "true": "false";
                    children = getNextNodes(workflow, node.id, branch );

                    console.log( `Condition ${node.id} result: ${output.result}`);
                    console.log(`Following ${branch} branch`);
                } else {
                    children = getNextNodes(workflow,node.id);
                }
                nextNodes.push(...children);

            } catch (error) {

                nodeExecution.status = "failed";
                nodeExecution.completedAt = new Date();
                nodeExecution.error = error.message;
                await execution.save();

                throw error;
            }
            await execution.save();
        }
        currentNodes = nextNodes;
    }
    return execution;
};


module.exports = { getStartNode, getNextNodes, executeWorkflow, };