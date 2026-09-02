const { Queue } = require("bullmq");

const redisConnection = require("../config/redis");

const workflowQueue = new Queue( "workflow-execution", {connection: redisConnection,});

module.exports = workflowQueue;
