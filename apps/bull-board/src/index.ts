import "./env";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import express from "express";
import { Redis } from "ioredis";

import { QueueName } from "@ovr/queue";

const PORT = Number(process.env.BULL_BOARD_PORT ?? 3001);

const connection = new Redis(process.env.VALKEY_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/");

createBullBoard({
  queues: Object.values(QueueName).map(
    (name) => new BullMQAdapter(new Queue(name, { connection })),
  ),
  serverAdapter,
});

const app = express();
app.use("/", serverAdapter.getRouter());
app.listen(PORT, () => {
  console.log(`Bull Board running at http://localhost:${PORT}`);
});
