const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const apiRequest = async (endpoint, options = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("flowforge_token") : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}`, } : {}), ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data;
};

export const createWorkflow = (workflow) =>
  apiRequest("/workflows", {
    method: "POST",
    body: JSON.stringify(workflow),
  });

export const getWorkflow = (id) =>
  apiRequest(`/workflows/${id}`);

export const updateWorkflow = (id, workflow) =>
  apiRequest(`/workflows/${id}`, {
    method: "PATCH",
    body: JSON.stringify(workflow),
  });