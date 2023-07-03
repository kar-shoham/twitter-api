import mongoose from "mongoose";


// for trending section of twitter
let hashtagSchema = new mongoose.Schema({
  hashtag: {
    type: String,
    unique: true,
  },
  count: {
    type: Number,
    default: 1,
  },
});

export default mongoose.model("Hashtag", hashtagSchema);
