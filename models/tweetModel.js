import mongoose from "mongoose";

let tweetSchema = mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  postBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  media: {
    public_id: String,
    url: String,
    resourceType: {
      type: String,
      enum: ["image", "video"],
    },
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  replies: [
    {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      tweet_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
      },
    },
  ],
  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  retweets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  parentTweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tweet",
  },
  isReply: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Tweet", tweetSchema);
