import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config/config.js";
import queueRoutes from "./routes/queueRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, config.publicDir)));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/queues", queueRoutes);

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});