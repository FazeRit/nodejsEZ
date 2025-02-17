import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import teamRoutes from "./routes/teamRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

const teamMembers = [
  { id: 1, name: "Daniil Yevstafiev", dynamic: false },
  { id: 2, name: "Denis Hutsan", dynamic: false },
  { id: 3, name: "Eldar Potapenko", dynamic: false },
  { id: 4, name: "Bogdan Pyata", dynamic: true },
  { id: 5, name: "Angelina Vashchenko", dynamic: true },
];

app.get("/", (req, res) => {
  res.render("index", { teamMembers });
});

app.use(teamRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
