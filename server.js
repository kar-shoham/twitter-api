import app from "./app.js";
import connectDB from "./config/connect.js";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import cors from 'cors'

dotenv.config({
  path: "./config/config.env",
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

let start = async () => {
  let server = app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}..`);
  });
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("Database connected...");
  } catch (err) {
    console.log(`Error ocured: ${err}`);
    console.log("Exiting the server...");
    server.close(() => {
      process.exit(1);
    });
  }
  try {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  } catch (error) {
    console.log(`Error ocured: ${err}`);
    server.close(() => {
      process.exit(1);
    });
  }
};

start();
