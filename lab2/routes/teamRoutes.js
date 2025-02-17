import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/team/1", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/html/danya.html"));
});

router.get("/team/2", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/html/denis.html"));
});

router.get("/team/3", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/html/eldar.html"));
});

const teamMembers = [
  {
    id: 4,
    name: "Bogdan Pyata",
    img: "/images/bogdanGitHub.png",
    description: "Bogdan supremacy.",
    gitHub: "https://github.com/Gertyul",
  },
  {
    id: 5,
    name: "Angelina Vashchenko",
    img: "/images/angelinaGitHub.png",
    description: "Angelina.",
    gitHub: "https://github.com/Anhelina06",
  },
];

router.get("/team/:id", (req, res) => {
  const member = teamMembers.find((m) => m.id === parseInt(req.params.id));
  if (member) {
    res.render("team-member", { member });
  } else {
    res.status(404).send("Error 404: Not Found");
  }
});

export default router;
