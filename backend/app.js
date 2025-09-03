import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Routes
import healthCheckRouter from "./routes/healthcheck.route.js";
import authRouter from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import projectNoteRoutes from "./routes/projectNotes.routes.js";
import commentRoutes from "./routes/noteComment.route.js";

// Middlewares
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

// =======================
// 🔧 Basic configuration
// =======================
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// =======================
// 🌍 CORS configuration
// =======================
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// =======================
// 📂 Routes
// =======================
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRoutes);

// Project Management routes
app.use("/api/v1/projects", projectRoutes);   // Projects + members
app.use("/api/v1/tasks", taskRoutes);         // Tasks + subtasks
app.use("/api/v1/notes", projectNoteRoutes);  // Project notes
app.use("/api/v1/comments", commentRoutes);      // Note comments

// =======================
// ❌ Error Handler
// =======================
app.use(errorHandler);

// =======================
// 🚀 Test Route
// =======================
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

export default app;
