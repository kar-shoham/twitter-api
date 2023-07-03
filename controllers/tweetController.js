import asyncWrapper from "../middlewares/asyncWrapper.js";
import Tweet from "../models/tweetModel.js";
import User from "../models/userModel.js";
import { createError } from "../utils/errorClass.js";
import getDataUri from "../utils/getDataUri.js";
import cloudinary from "cloudinary";

export let createTweet = asyncWrapper(async (req, res, next) => {
  let { text, resourceType } = req.body;
  let file = req.file;
  if (!text) {
    return next(createError("Tweet must contain a text", 400));
  }
  if (text.length < 5) {
    return next(createError("Text must be longer", 400));
  }
  let user = await User.findById(req.user._id);
  let newTweet = { text, postBy: user._id };
  if (file) {
    if (!resourceType) {
      return next(createError("Please specify file type", 400));
    }
    if (resourceType !== "image" && resourceType !== "video") {
      return next(createError("File type is not supported", 406));
    }
    let toUpload = await getDataUri(file);
    let options = { resource_type: resourceType };
    let fileToCloud = await cloudinary.v2.uploader.upload(
      toUpload.content,
      options
    );
    newTweet.media = {
      public_id: fileToCloud.public_id,
      url: fileToCloud.secure_url,
      resourceType,
    };
  }
  let tweet = new Tweet(newTweet);
  await tweet.save();
  user.tweets.unshift(tweet._id);
  await user.save();
  res.status(201).json({
    success: true,
    message: "Tweet created successfully",
    tweet,
  });
});

export let getTweet = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  if (!id) {
    return next(createError("Tweet not found", 404));
  }
  let tweet = await Tweet.findById(id);
  if (!tweet) {
    return next(createError("Tweet not found", 404));
  }
  res.json({
    success: true,
    tweet,
  });
});

export let deleteTweet = asyncWrapper(async (req, res, next) => {
  // parent delete hone pe bachcne wont get deleted, however child delete hone pe parent ke replies array se delete ho jaegaa child
  let { id } = req.params;
  if (!id) {
    return next(createError("Please enter a tweet id", 400));
  }
  let tweet = await Tweet.findById(id);
  if (!tweet) {
    return next(createError("Tweet not found", 404));
  }

  let tweetUser = await User.findById(tweet.postBy);
  if (tweetUser.username !== req.user.username) {
    return next(createError("You only delete your own tweets", 403));
  }
  if (tweet?.media?.public_id) {
    let options = {
      resource_type: tweet.media.resourceType,
    };
    await cloudinary.v2.uploader.destroy(tweet?.media?.public_id, options);
  }
  let isReply = tweet?.isReply;
  if (isReply) {
    let parentId = tweet?.parentTweet;
    let parentTweet = await Tweet.findById(parentId);
    if (parentTweet) {
      tweetUser.replies = tweetUser.replies.filter((ele) => !ele.id.equals(id));
      parentTweet.replies = parentTweet.replies.filter(
        (ele) => !ele.tweet_id.equals(id)
      );
      await parentTweet.save();
    }
  }
  await Tweet.findByIdAndDelete(id);
  if (!isReply) {
    tweetUser.tweets = tweetUser.tweets.filter((ele) => !ele.equals(id));
  }
  await tweetUser.save();

  res.json({
    success: true,
    message: "Tweet deleted successfully",
  });
});

export let updateTweet = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  let { text, resourceType } = req.body;
  let file = req.file;
  if (!id) {
    return next(createError("Tweet not found", 404));
  }
  let tweet = await Tweet.findById(id);
  if (!tweet) {
    return next(createError("Tweet not found", 404));
  }
  if (!file && !text) {
    return next(createError("Nothing to update", 400));
  }
  if (text) {
    tweet.text = text;
  }
  if (file) {
    if (!resourceType) {
      return next(createError("Please specify attachment type", 400));
    }
    let toDelete = tweet.media;
    if (toDelete) {
      let options = { resource_type: toDelete.resourceType };
      await cloudinary.v2.uploader.destroy(toDelete.public_id, options);
    }
    let toUpload = await getDataUri(file);
    let options = { resource_type: resourceType };
    let img = await cloudinary.v2.uploader.upload(toUpload.content, options);
    tweet.media = {
      public_id: img.public_id,
      url: img.secure_url,
      resourceType,
    };
  }
  await tweet.save();
  res.json({
    success: true,
    message: "Tweet updated successfully",
    tweet,
  });
});

export let toggleLikeTweet = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  if (!id) {
    return next(createError("Tweet not found", 404));
  }
  let tweet = await Tweet.findById(id);
  if (!tweet) {
    return next(createError("Tweet not found", 404));
  }
  let user = await User.findById(req.user._id);
  let isLiked = user.likes.some((ele) => ele.equals(id));
  if (isLiked) {
    user.likes = user.likes.filter((ele) => !ele.equals(id));
    tweet.likes = tweet.likes.filter((ele) => !ele.equals(user._id));
  } else {
    user.likes.push(id);
    tweet.likes.push(user._id);
  }
  await user.save();
  await tweet.save();
  let message = isLiked
    ? "Tweet unliked successfully"
    : "Tweet liked successfully";

  res.json({
    success: true,
    message,
  });
});

export let toggleBookmarkTweet = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  if (!id) {
    return next(createError("Tweet not found", 404));
  }
  let tweet = await Tweet.findById(id);
  if (!tweet) {
    return next(createError("Tweet not found", 404));
  }
  let user = await User.findById(req.user._id);
  let isBookmarked = user.bookmarks.some((ele) => ele.equals(id));
  if (isBookmarked) {
    user.bookmarks = user.bookmarks.filter((ele) => !ele.equals(id));
    tweet.bookmarks = tweet.bookmarks.filter((ele) => !ele.equals(user._id));
  } else {
    user.bookmarks.push(id);
    tweet.bookmarks.push(user._id);
  }
  await user.save();
  await tweet.save();
  let message = isBookmarked
    ? "Tweet removed from bookmarks successfully"
    : "Tweet added to bookmarks successfully";

  res.json({
    success: true,
    message,
  });
});

export let toggleRetweetTweet = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  if (!id) {
    return next(createError("Tweet not found", 404));
  }
  let tweet = await Tweet.findById(id);
  if (!tweet) {
    return next(createError("Tweet not found", 404));
  }
  let user = await User.findById(req.user._id);
  let isRetwitted = user.retweets.some((ele) => ele.equals(id));
  if (isRetwitted) {
    user.retweets = user.retweets.filter((ele) => !ele.equals(id));
    tweet.retweets = tweet.retweets.filter((ele) => !ele.equals(user._id));
  } else {
    user.retweets.unshift(id);
    tweet.retweets.push(user._id);
  }
  await user.save();
  await tweet.save();
  let message = isRetwitted
    ? "Tweet removed from retweets successfully"
    : "Retweeted successfully";

  res.json({
    success: true,
    message,
  });
});

export let replyTweet = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  if (!id) {
    return next(createError("Tweet not found", 404));
  }
  let tweet = await Tweet.findById(id);
  if (!tweet) {
    return next(createError("Tweet not found", 404));
  }
  let user = await User.findById(req.user._id);
  let { text, resourceType } = req.body;
  let file = req.file;
  if (!text) {
    return next(createError("Tweet must contain a text", 400));
  }
  if (text.length < 5) {
    return next(createError("Text must be longer", 400));
  }
  let newTweet = {
    text,
    postBy: user._id,
    parentTweet: tweet._id,
    isReply: true,
  };
  if (file) {
    if (!resourceType) {
      return next(createError("Please specify file type", 400));
    }
    if (resourceType !== "image" && resourceType !== "video") {
      return next(createError("File type is not supported", 406));
    }
    let toUpload = await getDataUri(file);
    let options = { resource_type: resourceType };
    let fileToCloud = await cloudinary.v2.uploader.upload(
      toUpload.content,
      options
    );
    newTweet.media = {
      public_id: fileToCloud.public_id,
      url: fileToCloud.secure_url,
      resourceType,
    };
  }
  let replyTweet = new Tweet(newTweet);
  await replyTweet.save();
  tweet.replies.push({
    user_id: user._id,
    tweet_id: replyTweet._id,
  });
  user.replies.push({
    id: replyTweet._id,
    originalId: tweet._id,
  });
  await tweet.save();
  await user.save();
  res.status(201).json({
    success: true,
    message: "Replied to tweet successfully",
    reply: replyTweet,
  });
});

export let getUserFeed = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  let { limit, page } = req.query;
  if (!limit) limit = 10;
  if (!page) page = 0;
  if (!id) {
    return next(createError("Invalid user id"));
  }
  let user = await User.findById(id);
  if (!user) {
    return next(createError("Invalid user id"));
  }
  let tweets = [];
  for (
    let i = page * limit, j = 0;
    i < user.tweets.length && j < limit;
    i++, j++
  ) {
    let tweet = await Tweet.findById(user.tweets[i]);
    tweets.push(tweet);
  }
  res.status(200).json({
    success: true,
    message: "All Tweets of user fetched successfully",
    tweets,
  });
});

export let getUserLikedPosts = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  let { limit, page } = req.query;
  if (!limit) limit = 10;
  if (!page) page = 0;
  if (!id) {
    return next(createError("Invalid user id"));
  }
  let user = await User.findById(id);
  if (!user) {
    return next(createError("Invalid user id"));
  }
  let tweets = [];
  for (
    let i = page * limit, j = 0;
    i < user.likes.length && j < limit;
    i++, j++
  ) {
    let tweet = await Tweet.findById(user.likes[i]);
    tweets.push(tweet);
  }
  res.status(200).json({
    success: true,
    message: "All liked posts of user fetched",
    tweets,
  });
});

export let getUserRetweets = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  let { limit, page } = req.query;
  if (!limit) limit = 10;
  if (!page) page = 0;
  if (!id) {
    return next(createError("Invalid user id"));
  }
  let user = await User.findById(id);
  if (!user) {
    return next(createError("Invalid user id"));
  }
  let tweets = [];
  for (
    let i = page * limit, j = 0;
    i < user.retweets.length && j < limit;
    i++, j++
  ) {
    let tweet = await Tweet.findById(user.retweets[i]);
    tweets.push(tweet);
  }
  res.status(200).json({
    success: true,
    message: "All retweets of user fetched",
    tweets,
  });
});

export let getUserReplies = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  let { limit, page } = req.query;
  if (!limit) limit = 10;
  if (!page) page = 0;
  if (!id) {
    return next(createError("Invalid user id"));
  }
  let user = await User.findById(id);
  if (!user) {
    return next(createError("Invalid user id"));
  }
  let tweets = [];
  for (
    let i = page * limit, j = 0;
    i < user.replies.length && j < limit;
    i++, j++
  ) {
    let reply = await Tweet.findById(user.replies[i].id);
    let originalTweet = await Tweet.findById(user.replies[i].originalId);
    tweets.push({ reply, originalTweet });
  }
  res.status(200).json({
    success: true,
    message: "All replies of user fetched",
    tweets,
  });
});

export let getMyTweets = asyncWrapper(async (req, res, next) => {
  let { limit, page } = req.query;
  if (!limit) limit = 10;
  if (!page) page = 0;
  let user = await User.findById(req.user._id);
  if (!user) {
    return next(createError("Invalid user id"));
  }
  let tweets = [];
  for (
    let i = page * limit, j = 0;
    i < user.tweets.length && j < limit;
    i++, j++
  ) {
    let tweet = await Tweet.findById(user.tweets[i]);
    tweets.push(tweet);
  }
  res.status(200).json({
    success: true,
    tweets,
  });
});

export let getMyLikes = asyncWrapper(async (req, res, next) => {
  let { limit, page } = req.query;
  if (!limit) limit = 10;
  if (!page) page = 0;
  let user = await User.findById(req.user._id);
  if (!user) {
    return next(createError("Invalid user id"));
  }
  let tweets = [];
  for (
    let i = page * limit, j = 0;
    i < user.likes.length && j < limit;
    i++, j++
  ) {
    let tweet = await Tweet.findById(user.likes[i]);
    tweets.push(tweet);
  }
  res.status(200).json({
    success: true,
    tweets,
  });
});

export let getMyRetweets = asyncWrapper(async (req, res, next) => {
  let { limit, page } = req.query;
  if (!limit) limit = 10;
  if (!page) page = 0;
  let user = await User.findById(req.user._id);
  if (!user) {
    return next(createError("Invalid user id"));
  }
  let tweets = [];
  for (
    let i = page * limit, j = 0;
    i < user.retweets.length && j < limit;
    i++, j++
  ) {
    let tweet = await Tweet.findById(user.retweets[i]);
    tweets.push(tweet);
  }
  res.status(200).json({
    success: true,
    tweets,
  });
});

export let getMyReplies = asyncWrapper(async (req, res, next) => {
  let { limit, page } = req.query;
  if (!limit) limit = 10;
  if (!page) page = 0;
  let user = await User.findById(req.user._id);
  if (!user) {
    return next(createError("Invalid user id"));
  }
  let tweets = [];
  for (
    let i = page * limit, j = 0;
    i < user.replies.length && j < limit;
    i++, j++
  ) {
    let reply = await Tweet.findById(user.replies[i].id);
    let originalTweet = await Tweet.findById(user.replies[i].originalId);
    tweets.push({ reply, originalTweet });
  }
  res.status(200).json({
    success: true,
    tweets,
  });
});

export let getMyFeed = asyncWrapper(async (req, res, next) => {
    
});
