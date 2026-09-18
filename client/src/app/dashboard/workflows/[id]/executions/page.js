"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getWorkflowExecutions } from "@/lib/api";

export default function ExecutionsPage() {
  const params = useParams();
  const workflowId = params.id;

  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workflowId) return;

    const loadExecutions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getWorkflowExecutions(workflowId);

        setExecutions(
          response?.data?.executions || []
        );
      } catch (error) {
        console.error("Load executions error:", error);

        setError(
          error?.message || "Failed to load executions."
        );
      } finally {
        setLoading(false);
      }
    };

    loadExecutions();
  }, [workflowId]);

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400";

      case "running":
        return "bg-blue-500/10 text-blue-400";

      case "queued":
        return "bg-yellow-500/10 text-yellow-400";

      case "failed":
        return "bg-red-500/10 text-red-400";

      default:
        return "bg-slate-800 text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-7xl p-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Execution History
            </h1>

            <p className="mt-2 text-slate-400">
              View previous workflow executions and their status.
            </p>
          </div>

          <Link
            href={`/dashboard/workflows/${workflowId}`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Back to Workflow
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Loading executions...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-900 bg-red-950/30 p-6 text-center">
            <p className="text-red-400">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          executions.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
              <h2 className="text-lg font-semibold">
                No executions yet
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                This workflow has not been executed yet.
              </p>

              <Link
                href={`/dashboard/workflows/${workflowId}`}
                className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
              >
                Back to Workflow
              </Link>
            </div>
          )}

        {/* Execution list */}
        {!loading && !error && executions.length > 0 && (
            <div className="space-y-4">
              {executions.map((execution) => (
                <Link
                  key={execution._id}
                  href={`/dashboard/workflows/${workflowId}/executions/${execution._id}`}
                  className="block"
                >
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-600 hover:bg-slate-800">

                    <div className="flex items-center justify-between gap-4">

                      <div>
                        <h3 className="font-semibold">
                          Execution #{execution._id.slice(-6)}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {execution.createdAt
                            ? new Date(
                                execution.createdAt
                              ).toLocaleString()
                            : "Unknown time"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          execution.status
                        )}`}
                      >
                        {execution.status}
                      </span>

                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">

                      <span className="text-slate-400">
                        Nodes:{" "}
                        {execution.nodeExecutions?.length || 0}
                      </span>

                      <span className="text-blue-400">
                        View Details →
                      </span>

                    </div>

                  </div>
                </Link>
              ))}
            </div>
          )}

      </main>
    </div>
  );
}