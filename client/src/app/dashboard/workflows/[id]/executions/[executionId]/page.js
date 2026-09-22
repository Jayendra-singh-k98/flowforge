"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getWorkflowExecution } from "@/lib/api";

const TERMINAL_STATUSES = ["completed", "failed"];
const POLL_INTERVAL_MS = 3000;

export default function ExecutionDetailsPage() {
  const params = useParams();
  const workflowId = params.id;
  const executionId = params.executionId;

  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const intervalRef = useRef(null);

  useEffect(() => {
    if (!executionId) return;
    let cancelled = false;

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const loadExecution = async (isPoll = false) => {
      try {
        if (!isPoll) {
          setLoading(true);
          setError("");
        }

        const response = await getWorkflowExecution(executionId);

        console.log("Execution details response:", response);
        
        const loaded = response?.data?.execution || null;
        if (cancelled) return;

        setExecution(loaded);
        if (loaded && TERMINAL_STATUSES.includes(loaded.status)) stopPolling();
      } catch (error) {
        console.error("Load execution error:", error);
        if (!isPoll) setError(error?.message || "Failed to load execution.");
        // poll errors are swallowed silently so a transient blip doesn't flip the page into an error state
      } finally {
        if (!isPoll) setLoading(false);
      }
    };

    loadExecution();
    intervalRef.current = setInterval(() => loadExecution(true), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [executionId]);

  const getStatusClass = (status) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-400";
      case "running": return "bg-blue-500/10 text-blue-400";
      case "queued": return "bg-yellow-500/10 text-yellow-400";
      case "failed": return "bg-red-500/10 text-red-400";
      default: return "bg-slate-800 text-slate-400";
    }
  };

  const formatDate = (date) => (date ? new Date(date).toLocaleString() : "—");
  const isLive = execution && !TERMINAL_STATUSES.includes(execution.status);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-7xl p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Execution Details</h1>
            <p className="mt-2 text-slate-400">View the result of this workflow execution.</p>
          </div>
          <Link
            href={`/dashboard/workflows/${workflowId}/executions`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            ← Execution History
          </Link>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Loading execution...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-900 bg-red-950/30 p-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && execution && (
          <>
            <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Execution #{execution._id?.slice(-6)}</h2>
                  <p className="mt-1 text-sm text-slate-400">Created {formatDate(execution.createdAt)}</p>
                </div>

                <div className="flex items-center gap-3">
                  {isLive && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                      Auto-refreshing
                    </span>
                  )}
                  <span className={`rounded-full px-4 py-2 text-sm font-medium ${getStatusClass(execution.status)}`}>
                    {execution.status}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-800/60 p-4">
                  <p className="text-xs text-slate-500">Started</p>
                  <p className="mt-1 text-sm text-slate-300">{formatDate(execution.startedAt)}</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-4">
                  <p className="text-xs text-slate-500">Completed</p>
                  <p className="mt-1 text-sm text-slate-300">{formatDate(execution.completedAt)}</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-4">
                  <p className="text-xs text-slate-500">Nodes Executed</p>
                  <p className="mt-1 text-sm text-slate-300">{execution.nodeExecutions?.length || 0}</p>
                </div>
              </div>

              {execution.error && (
                <div className="mt-5 rounded-lg border border-red-900 bg-red-950/30 p-4">
                  <p className="text-sm font-medium text-red-400">Execution Error</p>
                  <p className="mt-1 text-sm text-red-300">{execution.error}</p>
                </div>
              )}
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Node Executions</h2>
                <p className="mt-1 text-sm text-slate-400">Execution result for each workflow node.</p>
              </div>

              {execution.nodeExecutions?.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">
                  No node executions recorded.
                </div>
              ) : (
                <div className="space-y-4">
                  {execution.nodeExecutions.map((nodeExecution, index) => (
                    <NodeExecutionCard
                      key={nodeExecution.nodeId || index}
                      nodeExecution={nodeExecution}
                      index={index}
                      getStatusClass={getStatusClass}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function NodeExecutionCard({ nodeExecution, index, getStatusClass, formatDate }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Node {index + 1}</h3>
          <p className="mt-1 text-xs text-slate-500">{nodeExecution.nodeId}</p>
          <p className="mt-1 text-sm text-slate-400">Type: {nodeExecution.nodeType}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(nodeExecution.status)}`}>
          {nodeExecution.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">Started</p>
          <p className="text-sm text-slate-300">{formatDate(nodeExecution.startedAt)}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">Completed</p>
          <p className="text-sm text-slate-300">{formatDate(nodeExecution.completedAt)}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-medium text-slate-500">Input</p>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
          {JSON.stringify(nodeExecution.input || {}, null, 2)}
        </pre>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-medium text-slate-500">Output</p>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
          {JSON.stringify(nodeExecution.output || {}, null, 2)}
        </pre>
      </div>

      {nodeExecution.error && (
        <div className="mt-5 rounded-lg border border-red-900 bg-red-950/30 p-4">
          <p className="text-xs font-medium text-red-400">Error</p>
          <p className="mt-1 text-sm text-red-300">{nodeExecution.error}</p>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">Retry count: {nodeExecution.retryCount || 0}</div>
    </div>
  );
}