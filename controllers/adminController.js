import asyncWrapper from "../middlewares/asyncWrapper.js";
import Tweet from "../models/tweetModel.js";
import User from "../models/userModel.js";
import { createError } from "../utils/errorClass.js";
import cloudinary from 'cloudinary'

export let getAllUsers = asyncWrapper(async (req, res, next) => {
  let users = await User.find({});
  res.json({
    success: true,
    users,
    numUsers: users.length,
  });
});

export let deleteUser = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  if (!id) {
    return next(
      createError("Please enter a user id to delete the account", 400)
    );
  }
  let user = await User.findById(id);
  if (!user) {
    return next(createError("User not found", 404));
  }
  if (user.role === "admin") {
    return next(createError("Admin cannot delete another admin account", 400));
  }
  if(user?.profilePicture?.public_id){
    await cloudinary.v2.uploader.destroy(user?.profilePicture?.public_id)
  }
  if(user?.profilePicture?.public_id){
    await cloudinary.v2.uploader.destroy(user?.profilePicture?.public_id)
  }
  await User.findByIdAndDelete(id);
  res.json({
    success: true,
    message: "User deleted successfully",
  });
});

export let makeAdmin = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  if (!id) {
    return next(
      createError("Please enter a user id to delete the account", 400)
    );
  }
  let user = await User.findById(id);
  if (!user) {
    return next(createError("User not found", 404));
  }
  if (user.role === "admin") {
    return next(createError("Account is already an admin account", 400));
  }
  user.role = "admin";
  user.subscription.status = 'tick'
  user.verifiedType = 'black'
  await user.save();
  res.json({
    success: true,
    message: 'User is now an admin'
  })
});



export let giveTick = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  let {type} = req.body
  if(!type) type = 'blue'
  if (!id) {
    return next(
      createError("Please enter a user id to delete the account", 400)
    );
  }
  let user = await User.findById(id);
  if (!user) {
    return next(createError("User not found", 404));
  }
  if (user.role === "admin") {
    return next(createError("Account is already an admin account", 400));
  }
  if(user.subscription.status === 'tick'){
    return next(createError('User already has the verified tick', 400))
  }
  user.subscription.status = 'tick'
  user.verifiedType = type
  await user.save();
  res.json({
    success: true,
    message: 'User is now an admin'
  })
});

export let deleteUserTweet = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  if (!id) {
    return next(
      createError("Please enter a tweet id", 400)
    );
  }
  let tweet = await Tweet.findById(id);
  if (!tweet) {
    return next(createError("Tweet not found", 404));
  }
  let tweetUser = await User.findById(tweet.postBy)
  if (tweetUser.role !== 'user') {
    return next(createError("Cannot delete post by another admin", 400));
  }

  if(tweet?.media?.public_id){
    let options = {
      resource_type : 'image'
    }
    if(tweet.media.resourceType === 'video') options = {resource_type : 'video'}
    await cloudinary.v2.uploader.destroy(tweet?.media?.public_id, options)
  }

  await Tweet.findByIdAndDelete(id);
  res.json({
    success: true,
    message: "Tweet deleted successfully",
  });
});