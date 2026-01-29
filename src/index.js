const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const taskRoutes = require("./routes/task.routes");
const projectRoutes = require("./routes/project.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(helmet());
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"]
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);
app.use(express.json()); // ✅ REQUIRED for req.body

const path = require("path");

// serve static frontend files
app.use(express.static(path.join(__dirname, "../Front end")));

// open index.html on root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Front end/index.html"));
});

connectDB();

// ✅ mount routes
app.use("/auth", require("./routes/auth.routes"));
app.use("/admin", adminRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running: http://localhost:${PORT}`));


//convert


