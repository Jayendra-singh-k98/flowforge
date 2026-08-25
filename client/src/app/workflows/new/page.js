"use client";

import { useCallback, useState } from "react";

import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, } from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import TriggerNode from "@/components/workflow/TriggerNode";
import HttpNode from "@/components/workflow/HttpNode";
import EmailNode from "@/components/workflow/EmailNode";
import ConditionNode from "@/components/workflow/ConditionNode";
import NodePalette from "@/components/workflow/NodePalette";
import { createWorkflow, updateWorkflow, } from "@/lib/api";
import { serializeNodes, serializeEdges, } from "@/lib/workflowSerializer";

const nodeTypes = {
    trigger: TriggerNode,
    http: HttpNode,
    email: EmailNode,
    condition: ConditionNode,
};

const initialNodes = [
    {
        id: "trigger-1",
        type: "trigger",
        position: {
            x: 300,
            y: 100,
        },
        data: {
            label: "Manual Trigger",
        },
    },
];

const initialEdges = [];

export default function NewWorkflowPage() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const [workflowName, setWorkflowName] = useState("My Workflow");
    const [workflowDescription, setWorkflowDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSaveWorkflow = async () => {
        try {
            const trimmedName = workflowName.trim();

            if (!trimmedName) {
                alert("Workflow name is required");
                return;
            }

            setSaving(true);

            const workflow = {
                name: workflowName,
                description: workflowDescription.trim(),
                trigger: {
                    type: "manual",
                },
                nodes: serializeNodes(nodes),
                edges: serializeEdges(edges),
                status: "draft",
            };

            const response = await createWorkflow(workflow);

            console.log("Workflow saved:", response.data.workflow);

            alert("Workflow saved successfully");
        } catch (error) {
            console.error("Save workflow error:", error);

            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const onConnect = useCallback(
        (connection) => {
            setEdges((currentEdges) =>
                addEdge(connection, currentEdges)
            );
        },
        [setEdges]
    );

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
                    x: 300 + Math.random() * 200,
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

    return (
        <div className="h-screen w-full bg-slate-950 text-white">
            <div className="flex h-16 items-center justify-between border-b px-6">
                <h1 className="text-lg font-semibold tracking-tight text-white">
                    <span className="ml-2 text-slate-400">Workflow Builder</span>
                </h1>

                <input
                    value={workflowName}
                    onChange={(e) =>
                        setWorkflowName(e.target.value)
                    }
                    className="rounded-lg border px-3 py-2 text-sm"
                    placeholder="Workflow name"
                />

                <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-s transition hover:bg-slate-200 active:scale-95"
                    onClick={handleSaveWorkflow}
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Save Workflow"}
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