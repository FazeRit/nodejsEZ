import express from "express";
import * as queueController from "../controllers/queueController.js";
import { query, param, validationResult, body } from "express-validator";

const router = express.Router();

router.get(
  /^\/$/,
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
    console.log('Route hit: /queues GET, params:', req.params, 'query:', req.query);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', '),
        data: { queues: [], page: 1, limit: 10, totalPages: 0 },
      });
    }
    queueController.getAllQueues(req, res);
  }
);

router.get(
  "/:id(\\d+)",
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Queue ID must be a positive integer'),
  ],
  async (req, res, next) => {
    console.log('Route hit: /queues/:id GET, params:', req.params, 'query:', req.query);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', '),
        data: null,
      });
    }
    queueController.getQueueById(req, res);
  }
);

router.post(
  "/",
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isString()
      .withMessage('Name must be a string'),
    body('ownerId')
      .isInt({ min: 1 })
      .withMessage('Owner ID must be a positive integer'),
  ],
  async (req, res, next) => {
    console.log('Route hit: /queues POST, body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array().map(err => err.msg).join(', '),
        data: null,
      });
    }
    queueController.createQueue(req, res);
  }
);

router.post("/:id/join", queueController.joinQueue);
router.get("/:id/my-position", queueController.getUserPosition);
router.post("/:id/next", queueController.nextInQueue);
router.post("/:id/remove/:userId", queueController.removeUserFromQueue);
router.post("/:id/close", queueController.closeQueue);
router.post("/:id/delete", queueController.deleteQueue);
router.post("/:id/move-to-front", queueController.moveUserToFront);

export default router;