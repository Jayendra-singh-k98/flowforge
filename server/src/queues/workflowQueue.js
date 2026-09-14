const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");

const workflowQueue = new Queue(
    "workflow-execution",
    {
        connection: redisConnection,

        defaultJobOptions: {
            attempts: 3,

            backoff: { type: "exponential", delay: 2000, },

            removeOnComplete: { age: 3600, count: 100,},

            removeOnFail: { age: 86400, count: 500, },
        },
    }
);

module.exports = workflowQueue;