import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { MEMBERS_PAGES } from "../config/teamMembers.js";

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

router.get("/team/:id", (req, res) => {
  const member = MEMBERS_PAGES.find((m) => m.id === parseInt(req.params.id));
  if (member) {
    res.render("team-member", { member });
  } else {
    res.status(404).send("Error 404: Not Found");
  }
});

export default router;
