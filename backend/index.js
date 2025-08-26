import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config();

const PORT = process.env.PORT || 3000;



connectDB()
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
        process.exit(1);
    });

