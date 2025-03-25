import express from "express";
import bodyParser from "body-parser";
import * as queueController from "./controllers/queueController.js";

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/queues", queueController.getAllQueues);
app.get("/queues/:id", queueController.getQueueById);
app.post("/queues", queueController.createQueue);
app.post("/queues/:id/join", queueController.joinQueue);
app.get("/queues/:id/my-position", queueController.getUserPosition);
app.post("/queues/:id/next", queueController.nextInQueue);
app.post("/queues/:id/remove/:userId", queueController.removeUserFromQueue);
app.post("/queues/:id/close", queueController.closeQueue);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
