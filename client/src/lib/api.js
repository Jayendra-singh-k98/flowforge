const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors; // array of validation messages, when present
  }
}

const apiRequest = async (endpoint, options = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("flowforge_token") : null;

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (networkError) {
    // fetch itself threw — server unreachable, not an HTTP error response
    throw new ApiError("Cannot reach the server. Please check your connection and try again.", 0);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Session expired or invalid — clear it and send the user back to login,
    // rather than leaving them stuck on a page that will now fail every call.
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("flowforge_token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?error=session_expired";
      }
    }

    throw new ApiError(
      data.message || "Something went wrong",
      response.status,
      data.errors || null
    );
  }

  return data;
};

export { ApiError };

// ... rest of the file (createWorkflow, getWorkflows, etc.) unchanged

export const createWorkflow = (workflow) =>
  apiRequest("/workflows", {
    method: "POST",
    body: JSON.stringify(workflow),   
  });

export const getWorkflows = () =>
  apiRequest("/workflows");

export const getWorkflow = (id) =>
  apiRequest(`/workflows/${id}`);

export const updateWorkflow = (id, workflow) =>
  apiRequest(`/workflows/${id}`, {
    method: "PATCH",
    body: JSON.stringify(workflow),
  });

export const deleteWorkflow = (id) =>
  apiRequest(`/workflows/${id}`, {
    method: "DELETE",
  });


export const loginUser = (credentials) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
 
 
export const registerUser = (userData) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
 

export const getMe = () => apiRequest("/auth/me");

export const googleAuthUrl = () => `${API_URL}/auth/google`;

export const executeWorkflow = (workflowId) =>
  apiRequest(`/workflows/${workflowId}/execute`, {
    method: "POST",
  });

export const getWorkflowExecutions = (workflowId) =>
  apiRequest(`/workflows/${workflowId}/executions`);

export const getWorkflowExecution = (executionId) =>
  apiRequest(`/workflow-executions/${executionId}`);


