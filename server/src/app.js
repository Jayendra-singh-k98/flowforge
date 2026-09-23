const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const authRoutes = require("./routes/authRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const workflowExecutionRoutes = require("./routes/workflowExecutionRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimiter");

app.use(helmet());

const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow no-origin requests (e.g. curl, server-to-server, Postman)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));  
        },
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "FlowForge API is running"
    })
})

app.use("/api", generalLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api", workflowExecutionRoutes);
app.use(notFoundHandler);
app.use(errorHandler);


module.exports = app;