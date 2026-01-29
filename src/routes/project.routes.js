const express = require("express");
const router = express.Router();

const Project = require("../models/Project");
const User = require("../models/User");

const auth = require("../middleware/auth");

// ✅ Create project
router.post("/", auth, async (req, res) => {
  const { name, description } = req.body;

  const project = await Project.create({
    name,
    description,
    owner: req.user._id,
    members: [req.user._id],
  });

  res.json(project);
});

// ✅ Get my projects
router.get("/", auth, async (req, res) => {
  const projects = await Project.find({
    members: req.user._id,
  }).sort({ createdAt: -1 });

  res.json(projects);
});

// ✅ Add member to project
router.post("/:id/members", auth, async (req, res) => {
  const { email } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (String(project.owner) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only owner can add members" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (!project.members.includes(user._id)) {
    project.members.push(user._id);
    await project.save();
  }

  res.json(project);
});

// ✅ Remove member
router.delete("/:id/members/:userId", auth, async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (String(project.owner) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only owner can remove members" });
  }

  project.members = project.members.filter(
    (m) => String(m) !== req.params.userId
  );

  await project.save();
  res.json(project);
});

module.exports = router;
