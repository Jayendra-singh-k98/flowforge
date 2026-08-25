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

const nodeTypes = {
    trigger: TriggerNode,
    http: HttpNode,
    email: EmailNode,
    condition: ConditionNode,
};

export default function WorkflowPage() {
    const params = useParams();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);

    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [loading, setLoading] = useState(true);

    const [workflowName, setWorkflowName] = useState("");

    const [saving, setSaving] = useState(false);

    const onConnect = useCallback(
        (connection) => {
            setEdges((currentEdges) =>
                addEdge(connection, currentEdges)
            );
        },
        [setEdges]
    );

    useEffect(() => {
        const loadWorkflow = async () => {
            try {
                const response = await getWorkflow(params.id);

                const workflow = response.data.workflow;
                setWorkflowName(workflow.name);

                const flowNodes = workflow.nodes.map(
                    (node) => ({
                        id: node.id,

                        type: node.config?.nodeType || "http",

                        position: node.position || {
                            x: 250,
                            y: 100,
                        },

                        data: {
                            label: node.name,
                        },
                    })
                );

                const flowEdges = workflow.edges.map(
                    (edge) => ({
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                    })
                );

                setNodes(flowNodes);
                setEdges(flowEdges);
            } catch (error) {
                console.error(
                    "Load workflow error:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            loadWorkflow();
        }
    }, [params.id, setNodes, setEdges]);

    const handleSaveWorkflow = async () => {
        try {
            setSaving(true);

            const response = await updateWorkflow(
                params.id,
                {
                    name: workflowName,

                    nodes: nodes.map((node) => ({
                        id: node.id,

                        type:
                            node.type === "trigger"
                                ? "trigger"
                                : node.type === "condition"
                                    ? "condition"
                                    : "action",

                        name: node.data?.label || node.type,

                        position: {
                            x: node.position?.x || 0,
                            y: node.position?.y || 0,
                        },

                        config: {
                            nodeType: node.type,
                        },
                    })),

                    edges: edges.map((edge) => ({
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                    })),
                }
            );

            console.log(
                "Workflow updated:",
                response.data.workflow
            );

            alert("Workflow updated successfully");
        } catch (error) {
            console.error(
                "Update workflow error:",
                error
            );

            alert(error.message);
        } finally {
            setSaving(false);
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
                    label: labels[type],
                },
            };

            setNodes((currentNodes) => [
                ...currentNodes,
                newNode,
            ]);
        },
        [nodes.length, setNodes]
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading workflow...
            </div>
        );
    }

    return (

        <div className="h-screen w-full">
            <div className="flex h-16 items-center  justify-between border-b px-6">
                <h1 className="text-xl font-semibold">
                    FlowForge Workflow
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
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>


            <div className="flex h-[calc(100vh-4rem)]">
                <NodePalette
                    onAddNode={addWorkflowNode}
                />

                <div className="relative flex-1 bg-slate-950">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
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
            </div>
        </div>
    );
}