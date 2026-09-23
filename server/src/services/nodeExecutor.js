const executeTrigger = async (node, input) => {
    return { triggered: true, input, };
};

const { assertSafeUrl } = require("../utils/ssrfGuard");
const MAX_RESPONSE_BYTES = Number(process.env.HTTP_NODE_MAX_RESPONSE_BYTES) || 5 * 1024 * 1024; // 5MB default

const readBodyWithLimit = async (response, maxBytes) => {
    const reader = response.body?.getReader();
    if (!reader) return "";

    const decoder = new TextDecoder();
    let received = 0;
    let result = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        received += value.byteLength;
        if (received > maxBytes) {
            await reader.cancel();
            throw new Error(`Response exceeded maximum allowed size (${maxBytes} bytes)`);
        }

        result += decoder.decode(value, { stream: true });
    }

    return result;
};

const executeHttp = async (node, input) => {
    const config = node.config || {};
    const method = (config.method || "GET").toUpperCase();
    const url = config.url;

    if (!url) {
        throw new Error("HTTP node URL is required");
    }

    await assertSafeUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        let body;
        const headers = { ...(config.headers || {}) };

        if (!["GET", "HEAD"].includes(method) && config.body) {
            body = config.body;
            if (!headers["Content-Type"]) {
                headers["Content-Type"] = "application/json";
            }
        }

        console.log(`HTTP ${method} ${url}`);

        let currentUrl = url;
        let response;
        const MAX_REDIRECTS = 5;

        for (let i = 0; i <= MAX_REDIRECTS; i++) {
            response = await fetch(currentUrl, {
                method,
                headers,
                body,
                signal: controller.signal,
                redirect: "manual",
            });

            if ([301, 302, 303, 307, 308].includes(response.status)) {
                // Release the redirect response's body — we don't read it,
                // just cancel it so it doesn't linger.
                await response.body?.cancel();

                const location = response.headers.get("location");
                if (!location) {
                    throw new Error("Redirect response missing Location header");
                }
                currentUrl = new URL(location, currentUrl).toString();
                await assertSafeUrl(currentUrl);
                if (i === MAX_REDIRECTS) {
                    throw new Error("Too many redirects");
                }
                continue;
            }

            break;
        }

        const contentType = response.headers.get("content-type") || "";
        const rawBody = await readBodyWithLimit(response, MAX_RESPONSE_BYTES);

        let responseData;
        if (contentType.includes("application/json")) {
            try {
                responseData = JSON.parse(rawBody);
            } catch {
                responseData = rawBody; // not actually valid JSON despite the header — return as text
            }
        } else {
            responseData = rawBody;
        }

        if (!response.ok) {
            // Small, length-capped snippet for debuggability without risking
            // a huge error message from an oversized/unexpected response body.
            const snippet = typeof responseData === "string"
                ? responseData.slice(0, 200)
                : JSON.stringify(responseData).slice(0, 200);
            throw new Error(`HTTP request failed with status ${response.status}: ${snippet}`);
        }

        return { status: response.status, data: responseData };
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
            result = String(actualValue).includes(String(expectedValue));
            break;

        default:
            throw new Error(`Unsupported condition operator: ${operator}`);
    }

    return { result, field, actualValue, expectedValue, operator, };
};


const nodemailer = require("nodemailer");

const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const executeEmail = async (node, input) => {
    const config = node.config || {};

    const to = config.to;
    const subject = config.subject;
    const body = config.body;

    if (!to) {
        throw new Error("Email recipient is required");
    }

    if (!subject) {
        throw new Error("Email subject is required");
    }

    if (!body) {
        throw new Error("Email body is required");
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text: body,
    };

    const info = await emailTransporter.sendMail(mailOptions);

    return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
    };
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