import mongoose from "mongoose";

let hashtagSchema = new mongoose.Schema({
  hashtag: {
    type: String,
    unique: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("Hashtag", hashtagSchema);
