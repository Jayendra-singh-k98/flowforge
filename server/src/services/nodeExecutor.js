const executeTrigger = async (node, input) => {
    return { triggered: true, input, };
};

const executeHttp = async (node, input) => {
    const config = node.config || {};

    const method = (config.method || "GET").toUpperCase();
    const url = config.url;

    if (!url) {
        throw new Error("HTTP node URL is required");
    }

    // Validate URL
    let parsedUrl;

    try {
        parsedUrl = new URL(url);
    } catch (error) {
        throw new Error("Invalid HTTP node URL");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are supported");
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 10000);

    try {
        // const headers = {...(config.headers || {}),};

        let body;

        // GET and HEAD requests normally don't contain a body
        if (!["GET", "HEAD"].includes(method) && config.body) {
            body = config.body;
        }

        console.log(`HTTP ${method} ${url}`);

        const response = await fetch(url, {
            method,
            body,
            signal: controller.signal,
        });

        const contentType = response.headers.get("content-type") || "";

        let responseData;

        if (contentType.includes("application/json")) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        if (!response.ok) {
            throw new Error(`HTTP request failed with status ${response.status}`);
        }

        return {
            status: response.status,
            data: responseData,
        };
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("HTTP request timed out");
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
};

const getValueByPath = (object, path) => {
    if (!path) {
        return undefined;
    }
    return path.split(".").reduce((current, key) => current?.[key], object);
};
const executeCondition = async (node, input) => {
    const config = node.config || {};

    const field = config.field;
    const operator = config.operator;
    const expectedValue = config.value;

    if (!field) {
        throw new Error("Condition field is required");
    }

    if (!operator) {
        throw new Error("Condition operator is required");
    }

    const actualValue = getValueByPath(input, field);

    let result = false;

    switch (operator) {
        case "equals":
            result = String(actualValue) === String(expectedValue);
            break;

        case "not_equals":
            result = String(actualValue) !== String(expectedValue);
            break;

        case "greater_than":
            result = Number(actualValue) > Number(expectedValue);
            break;

        case "less_than":
            result = Number(actualValue) < Number(expectedValue);
            break;

        case "contains":
            result = String(actualValue).includes( String(expectedValue) );
            break;

        default:
            throw new Error( `Unsupported condition operator: ${operator}` );
    }

    return { result, field, actualValue, expectedValue, operator, };
};

const executeEmail = async (node, input) => {
    throw new Error("Email node executor is not implemented yet");
};

const executeNode = async (node, input = {}) => {

    const nodeType = node.config?.nodeType || node.type;

    switch (nodeType) {
        case "trigger":
            return executeTrigger(node, input);

        case "http":
            return executeHttp(node, input);

        case "condition":
            return executeCondition(node, input);

        case "email":
            return executeEmail(node, input);

        default:
            throw new Error(`Unsupported node type: ${nodeType}`);
    }
};

module.exports = { executeNode, };