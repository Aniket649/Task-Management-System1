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

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000", "ws://localhost:5000", "ws://127.0.0.1:5000"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'"],
      upgradeInsecureRequests: null
    }
  }
}));

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "https://task-management-system-md068pnbj-anikets-projects-6e5bab41.vercel.app",
    "https://task-management-system-gules.vercel.app"
  ],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);
app.use(express.json()); // ✅ REQUIRED for req.body

const path = require("path");

// Test route
app.get("/", (req, res) => res.send("API running"));

// serve static frontend files
app.use(express.static(path.join(__dirname, "../Front end")));

connectDB();

// ✅ mount routes
app.use("/auth", require("./routes/auth.routes"));
app.use("/admin", adminRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));


//convert


