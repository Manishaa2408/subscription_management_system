import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Brightloop SMS M5 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
      console.log(`Quotation Template API: http://localhost:${PORT}/api/quotation-templates`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
