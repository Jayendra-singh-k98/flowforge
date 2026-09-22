const executeTrigger = async (node, input) => {
    return { triggered: true, input, };
};

const { assertSafeUrl } = require("../utils/ssrfGuard");

const executeHttp = async (node, input) => {
    const config = node.config || {};
    const method = (config.method || "GET").toUpperCase();
    const url = config.url;

    if (!url) {
        throw new Error("HTTP node URL is required");
    }

    // SSRF protection: validate scheme, hostname, and resolved IPs
    // are not private/internal before making the request.
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

        // redirect: "manual" so we control and re-validate every hop —
        // otherwise a validated public URL could 302 to an internal one
        // and silently bypass the SSRF check above.
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
                const location = response.headers.get("location");
                if (!location) {
                    throw new Error("Redirect response missing Location header");
                }
                currentUrl = new URL(location, currentUrl).toString();
                await assertSafeUrl(currentUrl); // re-validate the new target
                if (i === MAX_REDIRECTS) {
                    throw new Error("Too many redirects");
                }
                continue;
            }

            break;
        }

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