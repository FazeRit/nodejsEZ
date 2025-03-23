/**
 * @fileoverview Точка входу для веб-додатку "Електронна черга" на базі Express.js з використанням ES Modules.
 *
 * @description
 * Цей файл налаштовує сервер Express, підключає middleware та визначає маршрути для управління чергами.
 * Він інтегрує архітектуру MVC, зв’язуючи контролери з HTTP-ендпоінтами та відображаючи сторінки через шаблони EJS.
 *
 * Основні налаштування:
 * - Використовує EJS як движок для рендерингу HTML на сервері.
 * - Використовує middleware `body-parser` для обробки даних із POST-запитів.
 * - Визначає RESTful-маршрути для операцій із чергами, делегуючи логіку `queueController`.
 * - Запускає сервер на порту 3000.
 *
 * @module app
 *
 * @requires express - Фреймворк для створення веб-додатків.
 * @requires body-parser - Middleware для парсингу тіла запитів.
 * @requires ./controllers/queueController.js - Контролер для обробки запитів, пов’язаних із чергами.
 *
 * @author [Ваше Ім’я]
 * @date 2025-02-27
 */

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
