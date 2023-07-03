import mongoose from "mongoose";

let connectDB = (url) => mongoose.connect(url);

export default connectDB;
