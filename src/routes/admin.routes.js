const express = require("express");
const User = require("../models/User");
const Task = require("../models/Task");
const Project = require("../models/Project");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

// ✅ List all users
router.get("/users", auth, admin, async (req, res) => {
  const users = await User.find().select("_id name email role createdAt").sort({ createdAt: -1 });
  res.json(users);
});

// ✅ Change user role
router.put("/users/:id/role", auth, admin, async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const u = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
    .select("_id name email role createdAt");
  if (!u) return res.status(404).json({ message: "User not found" });
  res.json(u);
});

// ✅ Delete user
router.delete("/users/:id", auth, admin, async (req, res) => {
  if (String(req.user._id) === String(req.params.id)) {
    return res.status(400).json({ message: "You cannot delete yourself" });
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

// ✅ Admin view: all tasks (optional but useful)
router.get("/tasks", auth, admin, async (req, res) => {
  const tasks = await Task.find()
    .populate("projectId", "name")
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.json(tasks);
});

// ✅ Admin view: all projects (optional)
router.get("/projects", auth, admin, async (req, res) => {
  const projects = await Project.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.json(projects);
});

module.exports = router;