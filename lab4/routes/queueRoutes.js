import express from "express";
import * as queueController from "../controllers/queueController.js";

const router = express.Router();

router.get("/", queueController.getAllQueues);
router.get("/:id", queueController.getQueueById);
router.post("/", queueController.createQueue);
router.post("/:id/join", queueController.joinQueue);
router.get("/:id/my-position", queueController.getUserPosition);
router.post("/:id/next", queueController.nextInQueue);
router.post("/:id/remove/:userId", queueController.removeUserFromQueue);
router.post("/:id/close", queueController.closeQueue);
router.post("/:id/delete", queueController.deleteQueue);

export default router;
