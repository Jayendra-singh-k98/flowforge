"use client";
import { useEffect, useCallback, useState, useRef } from "react";
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParams, useRouter } from "next/navigation";

import TriggerNode from "@/components/workflow/TriggerNode";
import HttpNode from "@/components/workflow/HttpNode";
import EmailNode from "@/components/workflow/EmailNode";
import ConditionNode from "@/components/workflow/ConditionNode";
import NodePalette from "@/components/workflow/NodePalette";
import NodeConfigPanel from "@/components/workflow/NodeConfigPanel";
import { validateWorkflow } from "@/lib/workflowValidator";
import { serializeNodes, serializeEdges } from "@/lib/workflowSerializer";
import { getWorkflow, updateWorkflow, createWorkflow, executeWorkflow } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const nodeTypes = { trigger: TriggerNode, http: HttpNode, email: EmailNode, condition: ConditionNode };

export default function WorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const isNewWorkflow = params.id === "new";
  const workflowId = params.id;

  const [nodes, setNodes, reactFlowOnNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [running, setRunning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);

  const lastSavedRef = useRef(null);

  const handleNodeClick = useCallback((event, node) => setSelectedNode(node), []);

  const onConnect = useCallback(
    (connection) => setEdges((currentEdges) => addEdge(connection, currentEdges)),
    [setEdges]
  );

  const initialNodes = [
    {
      id: "trigger-1",
      type: "trigger",
      position: { x: 300, y: 50 },
      data: { label: "Manual Trigger", config: { triggerType: "manual" } },
    },
  ];

  useEffect(() => {
    if (isNewWorkflow) {
      setNodes(initialNodes);
      setEdges([]);
      setWorkflowName(""); // was "Select Workflow Name" — that string was getting saved as the real name
      lastSavedRef.current = JSON.stringify({ name: "", nodes: initialNodes, edges: [] });
      setLoading(false);
      return;
    }

    const loadWorkflow = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await getWorkflow(params.id);
        const workflow = response.data.workflow;

        setWorkflowName(workflow.name);

        const flowNodes = workflow.nodes.map((node) => ({
          id: node.id,
          type: node.config?.nodeType || "http",
          position: node.position || { x: 250, y: 100 },
          data: { label: node.name, config: node.config || {} },
        }));

        const flowEdges = workflow.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          sourceHandle: edge.sourceHandle ?? null,
          target: edge.target,
          targetHandle: edge.targetHandle ?? null,
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
        lastSavedRef.current = JSON.stringify({ name: workflow.name, nodes: flowNodes, edges: flowEdges });
      } catch (error) {
        console.error("Load workflow error:", error);
        setLoadError(error.message || "Failed to load workflow.");
      } finally {
        setLoading(false);
      }
    };

    loadWorkflow();
  }, [params.id, isNewWorkflow, setNodes, setEdges]);

  // Dirty-check against last saved snapshot
  useEffect(() => {
    if (loading) return;
    const snapshot = JSON.stringify({ name: workflowName, nodes, edges });
    setIsDirty(snapshot !== lastSavedRef.current);
  }, [workflowName, nodes, edges, loading]);

  // Warn on tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const guardedNavigate = (url) => {
    if (isDirty) setPendingNav(url);
    else router.push(url);
  };

  const updateSelectedNode = useCallback(
    (updates) => {
      if (!selectedNode) return;
      const updatedNode = {
        ...selectedNode,
        data: { ...selectedNode.data, config: { ...(selectedNode.data?.config || {}), ...updates } },
      };
      setSelectedNode(updatedNode);
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id !== selectedNode.id
            ? node
            : { ...node, data: { ...node.data, config: { ...(node.data?.config || {}), ...updates } } }
        )
      );
    },
    [selectedNode, setNodes]
  );

  const handleSaveWorkflow = async () => {
    const trimmedName = workflowName.trim();

    if (!trimmedName) {
      toast.error("Give your workflow a name before saving.");
      return;
    }

    try {
      setSaving(true);
      const errors = validateWorkflow(nodes, edges);

      if (errors.length > 0) {
        toast.error(errors, "Fix the following before saving");
        return;
      }

      const triggerNode = nodes.find((node) => node.type === "trigger");
      const workflowData = {
        name: trimmedName,
        trigger: { type: triggerNode?.data?.config?.triggerType || "manual" },
        nodes: serializeNodes(nodes),
        edges: serializeEdges(edges),
        status: "draft",
      };

      if (isNewWorkflow) {
        const response = await createWorkflow(workflowData);
        toast.success("Workflow created.");
        lastSavedRef.current = JSON.stringify({ name: trimmedName, nodes, edges });
        setIsDirty(false);
        router.replace(`/dashboard/workflows/${response.data.workflow._id}`);
      } else {
        await updateWorkflow(params.id, workflowData);
        toast.success("Workflow updated.");
        lastSavedRef.current = JSON.stringify({ name: trimmedName, nodes, edges });
        setIsDirty(false);
      }
    } catch (error) {
      console.error("Save workflow error:", error);
      toast.error(error.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case "trigger":
        return { triggerType: "manual" };
      case "http":
        return { method: "GET", url: "", body: "" };
      case "email":
        return { to: "", subject: "", body: "" };
      case "condition":
        return { field: "", operator: "equals", value: "" };
      default:
        return {};
    }
  };

  const addWorkflowNode = useCallback(
    (type) => {
      const nodeId = `${type}-${Date.now()}`;
      const labels = { trigger: "Manual Trigger", http: "HTTP Request", email: "Send Email", condition: "Condition" };
      const newNode = {
        id: nodeId,
        type,
        position: { x: 300, y: 150 + nodes.length * 100 },
        data: { label: labels[type], config: getDefaultConfig(type) },
      };
      setNodes((currentNodes) => [...currentNodes, newNode]);
    },
    [nodes.length, setNodes]
  );

  const onNodesChange = useCallback(
    (changes) => {
      const deletedNodeIds = changes.filter((c) => c.type === "remove").map((c) => c.id);
      if (selectedNode && deletedNodeIds.includes(selectedNode.id)) setSelectedNode(null);
      reactFlowOnNodesChange(changes);
    },
    [selectedNode, reactFlowOnNodesChange]
  );

  const handleRunWorkflow = async () => {
    try {
      setRunning(true);
      const response = await executeWorkflow(params.id);
      const executionId = response.data.execution.id;
      router.push(`/dashboard/workflows/${params.id}/executions/${executionId}`);
    } catch (error) {
      console.error("Run workflow error:", error);
      toast.error(error.message || "Failed to run workflow.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 text-slate-400">
        Loading workflow...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 bg-slate-950 text-slate-400">
        <p className="text-red-400">{loadError}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/dashboard/workflows")}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full bg-slate-950 overflow-hidden">
      <div className="flex h-16 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-6 shrink-0">
        <div className="flex min-w-0 items-center gap-4">
          <button onClick={() => guardedNavigate("/dashboard/workflows")} className="shrink-0 text-sm text-slate-400 hover:text-white">
            ← Workflows
          </button>

          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="max-w-md rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
            placeholder="Workflow name"
          />

          {isDirty && <span className="shrink-0 text-xs text-amber-400">● Unsaved changes</span>}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSaveWorkflow}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : isNewWorkflow ? "Create Workflow" : "Save Changes"}
          </button>

          <button
            onClick={handleRunWorkflow}
            disabled={running || isNewWorkflow}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Running..." : "▶ Run Workflow"}
          </button>

          {!isNewWorkflow && (
            <button
              onClick={() => guardedNavigate(`/dashboard/workflows/${workflowId}/executions`)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Execution History
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <NodePalette onAddNode={addWorkflowNode} />

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
                  case "trigger": return "#2563eb";
                  case "http": return "#9333ea";
                  case "email": return "#16a34a";
                  case "condition": return "#f97316";
                  default: return "#475569";
                }
              }}
            />
          </ReactFlow>
        </div>

        <NodeConfigPanel node={selectedNode} onUpdate={updateSelectedNode} onClose={() => setSelectedNode(null)} />
      </div>

      <ConfirmDialog
        open={!!pendingNav}
        title="Leave without saving?"
        description="You have unsaved changes. If you leave now, they'll be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
        danger
        onConfirm={() => {
          const url = pendingNav;
          setPendingNav(null);
          router.push(url);
        }}
        onCancel={() => setPendingNav(null)}
      />
    </div>
  );
}