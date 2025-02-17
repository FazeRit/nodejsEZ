import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import teamRoutes from "./routes/teamRoutes.js";
import { TEAM_MEMBERS } from "./config/teamMembers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { teamMembers: TEAM_MEMBERS });
});

app.use(teamRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
