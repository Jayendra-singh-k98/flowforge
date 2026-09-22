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
        const loaded = response?.data?.execution || null;
        if (cancelled) return;

        setExecution(loaded);
        if (loaded && TERMINAL_STATUSES.includes(loaded.status)) stopPolling();
      } catch (error) {
        console.error("Load execution error:", error);
        if (!isPoll) setError(error?.message || "Failed to load execution.");
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

  const formatDate = (date) => (date ? new Date(date).toLocaleString() : "—");
  const isLive = execution && !TERMINAL_STATUSES.includes(execution.status);

  const getStatusPillClass = (status) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-400";
      case "running": return "bg-blue-500/10 text-blue-400";
      case "queued": return "bg-yellow-500/10 text-yellow-400";
      case "failed": return "bg-red-500/10 text-red-400";
      default: return "bg-slate-800 text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-4xl p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Execution Details</h1>
            <p className="mt-2 text-slate-400">Watch this workflow run, step by step.</p>
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
            {/* Summary */}
            <section className="mb-10 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Execution #{execution._id?.slice(-6)}</h2>
                  <p className="mt-1 text-sm text-slate-400">Started {formatDate(execution.startedAt)}</p>
                </div>

                <div className="flex items-center gap-3">
                  {isLive && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                      Live
                    </span>
                  )}
                  <span className={`rounded-full px-4 py-2 text-sm font-medium ${getStatusPillClass(execution.status)}`}>
                    {execution.status}
                  </span>
                </div>
              </div>

              {execution.error && (
                <div className="rounded-lg border border-red-900 bg-red-950/30 p-4">
                  <p className="text-sm font-medium text-red-400">Execution Error</p>
                  <p className="mt-1 text-sm text-red-300">{execution.error}</p>
                </div>
              )}
            </section>

            {/* Timeline */}
            <section>
              <h2 className="mb-6 text-xl font-semibold">Run Timeline</h2>

              {execution.nodeExecutions?.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">
                  No steps recorded yet.
                </div>
              ) : (
                <NodeTimeline nodeExecutions={execution.nodeExecutions} formatDate={formatDate} />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function NodeTimeline({ nodeExecutions, formatDate }) {
  return (
    <div className="relative">
      {nodeExecutions.map((nodeExecution, index) => (
        <TimelineStep
          key={nodeExecution.nodeId || index}
          nodeExecution={nodeExecution}
          index={index}
          isLast={index === nodeExecutions.length - 1}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
}

function TimelineStep({ nodeExecution, index, isLast, formatDate }) {
  const [expanded, setExpanded] = useState(false);
  const status = nodeExecution.status;
  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  const dotStyles = isCompleted
    ? "border-green-500 bg-green-500/20 text-green-400"
    : isFailed
    ? "border-red-500 bg-red-500/20 text-red-400"
    : isRunning
    ? "border-blue-500 bg-blue-500/20 text-blue-400"
    : "border-slate-700 bg-slate-800 text-slate-500";

  const connectorStyles = isCompleted || isFailed ? "bg-green-500/50" : "bg-slate-700";

  return (
    <div className="relative flex gap-3 pb-1">
      {!isLast && (
        <div className={`absolute left-3 top-7 h-[calc(100%-1.5rem)] w-px ${connectorStyles}`} />
      )}

      <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-slate-950 ${dotStyles}`}>
        {isCompleted && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {isFailed && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {isRunning && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-blue-400" />}
        {!isCompleted && !isFailed && !isRunning && <span className="h-1 w-1 rounded-full bg-slate-600" />}
      </div>

      <div className="min-w-0 flex-1 pb-3">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-900"
        >
          <span className="text-xs text-slate-600">{index + 1}.</span>
          <span className="truncate font-medium text-white">{nodeExecution.nodeType}</span>
          {isRunning && <span className="text-xs text-blue-400">running…</span>}
          <span className="ml-auto shrink-0 text-xs text-slate-500">
            {formatDate(nodeExecution.completedAt || nodeExecution.startedAt)}
          </span>
          <svg
            className={`h-3 w-3 shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="ml-2 mt-1 space-y-2 border-l border-slate-800 pl-4 text-xs">
            <div>
              <p className="mb-1 text-slate-500">Input</p>
              <pre className="max-h-28 overflow-auto rounded-md bg-slate-950 p-2 text-slate-300">
                {JSON.stringify(nodeExecution.input || {}, null, 2)}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-slate-500">Output</p>
              <pre className="max-h-28 overflow-auto rounded-md bg-slate-950 p-2 text-slate-300">
                {JSON.stringify(nodeExecution.output || {}, null, 2)}
              </pre>
            </div>
            {nodeExecution.error && (
              <p className="rounded-md border border-red-900 bg-red-950/30 p-2 text-red-300">
                {nodeExecution.error}
              </p>
            )}
            {nodeExecution.retryCount > 0 && (
              <p className="text-slate-500">Retries: {nodeExecution.retryCount}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}