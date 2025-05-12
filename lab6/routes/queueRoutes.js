import express from "express";
import * as queueController from "../controllers/queueController.js";
import { query, validationResult } from "express-validator";

const router = express.Router();

router.get("/", queueController.getAllQueues);
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Limit must be a positive integer'),
    query('q')
      .optional()
      .isString()
      .trim()
      .withMessage('Filter must be a string'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('queues', {
        queues: [],
        error: errors.array().map(err => err.msg).join(', '),
        page: 1,
        limit: 10,
        totalPages: 0,
        q: req.query.q || '',
      });
    }
    queueController.getAllQueues;
  },
);
router.get("/:id", queueController.getQueueById);
router.post("/", queueController.createQueue);
router.post("/:id/join", queueController.joinQueue);
router.get("/:id/my-position", queueController.getUserPosition);
router.post("/:id/next", queueController.nextInQueue);
router.post("/:id/remove/:userId", queueController.removeUserFromQueue);
router.post("/:id/close", queueController.closeQueue);
router.post("/:id/delete", queueController.deleteQueue);
router.post('/:id/move-to-front', queueController.moveUserToFront);

export default router;
