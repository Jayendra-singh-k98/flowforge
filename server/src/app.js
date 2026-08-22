const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const authRoutes = require("./routes/authRoutes");

app.use(helmet());

app.use(
    cors({
        origin:"http://localhost:3000",
        credentials:true
    })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "FlowForge API is running"
    })
})

app.use("/api/auth", authRoutes);

module.exports = app;