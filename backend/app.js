import express from "express";
import cors from "cors";



const app = express();

//basic configuration
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//cors configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

//routes
import healthCheckRouter from "./routes/healthcheck.route.js";
import authRouter from "./routes/auth.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use(errorHandler);


// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

export default app;