const express = require("express");
const Task = require("../models/Task");
const Project = require("../models/Project");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all tasks for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    let filter = { userId: req.user._id };

    if (projectId) {
      filter.projectId = projectId;
    }

    const tasks = await Task.find(filter)
      .populate("projectId", "name")
      .populate("assigneeIds", "name")
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get tasks for a specific project (with membership check)
router.get("/project/:projectId", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not a project member" });
    }

    const tasks = await Task.find({ projectId: project._id })
      .populate("assigneeIds", "name")
      .populate("comments.userId", "name")
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get a single task
router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id })
      .populate("projectId", "name")
      .populate("assigneeIds", "name")
      .populate("comments.userId", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create a new task
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      status,
      priority,
      assigneeIds,
      dueDate,
      tags,
    } = req.body;

    const task = new Task({
      title,
      description,
      projectId,
      userId: req.user._id,
      status: status || "todo",
      priority: priority || "medium",
      assigneeIds: assigneeIds || [],
      dueDate,
      tags: tags || [],
      activity: ["Task created"],
    });

    await task.save();
    await task.populate("projectId", "name");
    await task.populate("assigneeIds", "name");

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update a task
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      assigneeIds,
      dueDate,
      tags,
    } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        title,
        description,
        status,
        priority,
        assigneeIds,
        dueDate,
        tags,
      },
      { new: true }
    )
      .populate("projectId", "name")
      .populate("assigneeIds", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add a comment to a task
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const { text } = req.body;

    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.comments.push({
      userId: req.user._id,
      text,
    });

    await task.save();
    await task.populate("comments.userId", "name");

    res.json(task.comments[task.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a task
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
