"use client";

import { useEffect, useCallback, useState } from "react";

import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { useParams } from "next/navigation";

import { getWorkflow, updateWorkflow } from "@/lib/api";

import TriggerNode from "@/components/workflow/TriggerNode";
import HttpNode from "@/components/workflow/HttpNode";
import EmailNode from "@/components/workflow/EmailNode";
import ConditionNode from "@/components/workflow/ConditionNode";
import NodePalette from "@/components/workflow/NodePalette";
import NodeConfigPanel from "@/components/workflow/NodeConfigPanel";
import { validateWorkflow } from "@/lib/workflowValidator";
import { serializeNodes, serializeEdges } from "@/lib/workflowSerializer";
import { createWorkflow } from "@/lib/api";


const nodeTypes = {
    trigger: TriggerNode,
    http: HttpNode,
    email: EmailNode,
    condition: ConditionNode,
};

export default function WorkflowPage() {
    const params = useParams();

    const isNewWorkflow = params.id === "new";

    const [nodes, setNodes, reactFlowOnNodesChange,] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [workflowName, setWorkflowName] = useState("");
    const [saving, setSaving] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);

    const handleNodeClick = useCallback(
        (event, node) => {
            setSelectedNode(node);
        },
        []
    );

    const onConnect = useCallback(
        (connection) => {
            setEdges((currentEdges) =>
                addEdge(connection, currentEdges)
            );
        },
        [setEdges]
    );

    const initialNodes = [
        {
            id: "trigger-1",
            type: "trigger",
            position: {
                x: 300,
                y: 50,
            },
            data: {
                label: "Manual Trigger",
                config: {
                    triggerType: "manual",
                },
            },
        },
    ];

    useEffect(() => {
        if (isNewWorkflow) {
            setNodes(initialNodes);
            setEdges([]);
            setWorkflowName("Select Workflow Name");
            setLoading(false);

            return;
        }

        const loadWorkflow = async () => {
            try {
                const response = await getWorkflow(params.id);

                const workflow = response.data.workflow;

                setWorkflowName(workflow.name);

                const flowNodes = workflow.nodes.map((node) => ({
                    id: node.id,

                    type: node.config?.nodeType || "http",

                    position: node.position || {
                        x: 250,
                        y: 100,
                    },

                    data: {
                        label: node.name,
                        config: node.config || {},
                    },
                }));

                const flowEdges = workflow.edges.map((edge) => ({
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                }));

                setNodes(flowNodes);
                setEdges(flowEdges);

            } catch (error) {
                console.error( "Load workflow error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadWorkflow();
    }, [params.id, isNewWorkflow, setNodes, setEdges]);


    const updateSelectedNode = useCallback(
        (updates) => {
            if (!selectedNode) {
                return;
            }

            const updatedNode = {
                ...selectedNode,
                data: {
                    ...selectedNode.data,
                    config: {
                        ...(selectedNode.data?.config || {}),
                        ...updates,
                    },
                },
            };

            setSelectedNode(updatedNode);

            setNodes((currentNodes) =>
                currentNodes.map((node) => {
                    if (node.id !== selectedNode.id) {
                        return node;
                    }

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            config: {
                                ...(node.data?.config || {}),
                                ...updates,
                            },
                        },
                    };
                })
            );
        },
        [selectedNode, setNodes]
    );

    const handleSaveWorkflow = async () => {
        try {
            const trimmedName = workflowName.trim();

            if (!trimmedName) {
                alert("Workflow name is required");
                return;
            }

            setSaving(true);

            const errors = validateWorkflow(nodes, edges);

            if (errors.length > 0) {
                alert("Please fix the following errors:\n\n" + errors.join("\n"));
                return;
            }

            const triggerNode = nodes.find((node) => node.type === "trigger");

            const workflowData = {
                name: trimmedName,
                trigger: {
                    type: triggerNode?.data?.config?.triggerType || "manual",
                },
                nodes: serializeNodes(nodes),
                edges: serializeEdges(edges),
                status: "draft",
            };

            let response;

            if (isNewWorkflow) {
                response = await createWorkflow(workflowData);
                alert("Workflow created successfully");
            } else {
                response = await updateWorkflow(params.id, workflowData);
                alert("Workflow updated successfully");
            }

            console.log("Workflow saved:", response.data.workflow);

        } catch (error) {
            console.error("Save workflow error:", error);
            alert(error.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const getDefaultConfig = (type) => {
        switch (type) {
            case "trigger":
                return {
                    triggerType: "manual",
                };

            case "http":
                return { method: "GET", url: "", body: "", };

            case "email":
                return { to: "", subject: "", body: "", };

            case "condition":
                return { field: "", operator: "equals", value: "", };

            default:
                return {};
        }
    };

    const addWorkflowNode = useCallback(
        (type) => {
            const nodeId = `${type}-${Date.now()}`;

            const labels = {
                trigger: "Manual Trigger",
                http: "HTTP Request",
                email: "Send Email",
                condition: "Condition",
            };

            const newNode = {
                id: nodeId,
                type,
                position: {
                    x: 300,
                    y: 150 + nodes.length * 100,
                },
                data: {
                    label: labels[type], config: getDefaultConfig(type),
                },
            };

            setNodes((currentNodes) => [...currentNodes, newNode,]);
        },
        [nodes.length, setNodes]
    );

    const onNodesChange = useCallback(
        (changes) => {
            const deletedNodeIds = changes.filter((change) => change.type === "remove").map((change) => change.id);

            if (selectedNode && deletedNodeIds.includes(selectedNode.id)) {
                setSelectedNode(null);
            }

            reactFlowOnNodesChange(changes);
        },
        [selectedNode, reactFlowOnNodesChange,]
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading workflow...
            </div>
        );
    }

    return (

        <div className="flex flex-col h-screen w-full bg-slate-950 overflow-hidden">
            <div className="flex h-16 items-center justify-between border-b px-6 bg-slate-900 shrink-0">
                <h1 className="text-xl font-semibold">
                    {isNewWorkflow ? "Create Workflow" : "FlowForge Workflow"}
                </h1>

                <input
                    value={workflowName}
                    onChange={(e) =>
                        setWorkflowName(e.target.value)
                    }
                    className="rounded-lg border px-3 py-2"
                    placeholder="Workflow name"
                />

                <button
                    onClick={handleSaveWorkflow}
                    disabled={saving}
                    className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                    {saving ? "Saving..." : isNewWorkflow ? "Create Workflow" : "Save Changes"}
                </button>
            </div>


            <div className="flex flex-1 overflow-hidden">
                <NodePalette
                    onAddNode={addWorkflowNode}
                />

                <div className="relative flex-1 bg-slate-950 overflow-hidden">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={handleNodeClick}
                        deleteKeyCode={["Backspace", "Delete"]}
                        fitView
                    >
                        <Background color="#334155" gap={20} size={1} />
                        <Controls position="bottom-left" />
                        <MiniMap
                            nodeColor={(node) => {
                                switch (node.type) {
                                    case "trigger":
                                        return "#2563eb";

                                    case "http":
                                        return "#9333ea";

                                    case "email":
                                        return "#16a34a";

                                    case "condition":
                                        return "#f97316";

                                    default:
                                        return "#475569";
                                }
                            }}
                        />
                    </ReactFlow>
                </div>
                <NodeConfigPanel
                    node={selectedNode}
                    onUpdate={updateSelectedNode}
                    onClose={() => setSelectedNode(null)}
                />
            </div>
        </div>
    );
}