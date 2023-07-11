import User from "../models/userModel.js";
import asyncWrapper from "../middlewares/asyncWrapper.js";
import { createError } from "../utils/errorClass.js";
import sendToken from "../utils/sendToken.js";
import cloudinary from "cloudinary";
import getDataUri from "../utils/getDataUri.js";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";

let options = {
  httpOnly: true,
  sameSite: "none",
  secure: true,
};

export let register = asyncWrapper(async (req, res, next) => {
  let { name, username, email, password } = req.body;
  let file = req.file;
  if (!name || !username || !email || !password) {
    return next(createError("Some of the fields are missing", 422));
  }
  username = username.split(" ").join("");
  let userDetails = { name, username, password, email };
  if (file) {
    let toUpload = await getDataUri(file);
    let img = await cloudinary.v2.uploader.upload(toUpload.content);
    userDetails.profilePicture = {
      public_id: img.public_id,
      url: img.secure_url,
    };
  }
  let user = new User(userDetails);
  await user.save();
  sendToken(user, "User registered successfully", 201, res);
});

export let login = asyncWrapper(async (req, res, next) => {
  let { email, password } = req.body;
  if (!email || !password) {
    return next(createError("Some of the fields are missing", 422));
  }
  let user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(createError("Invalid email or password", 400));
  }
  let isMatched = await user.verifyPassword(password);
  if (!isMatched) {
    return next(createError("Invalid email or password", 400));
  }
  sendToken(user, "Logged in successfully", 200, res);
});

export let logout = asyncWrapper(async (req, res, next) => {
  res.status(200).cookie("token", "", options).json({
    success: true,
    message: "Logged out successfully",
  });
});

export let updateProfile = asyncWrapper(async (req, res, next) => {
  let { name, bio, location, website } = req.body;
  if (!name && !bio && !location && !website) {
    return next(createError("There is nothing to update"));
  }
  let user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (location) user.location = location;
  if (website) user.website = website;
  await user.save();
  res.json({
    success: true,
    message: "Profile updated successfuly",
  });
});

export let getMyProfile = asyncWrapper(async (req, res, next) => {
  let id = req.user._id;
  let user = await User.findById(id).select(
    "-profileViews -__v -resetPasswordToken -resetTokenExpiry"
  );
  res.json({
    success: true,
    user,
  });
});

export let updatePassword = asyncWrapper(async (req, res, next) => {
  let { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return next(createError("Some of the fields are missing", 422));
  }
  if (newPassword.length < 8) {
    return next(createError("Password must be longer", 400));
  }
  let user = await User.findById(req.user._id).select("+password");
  let isMatch = user.verifyPassword(oldPassword);
  if (!isMatch) {
    return next(createError("Invalid old password", 403));
  }
  user.password = newPassword;
  await user.save();
  res.json({
    success: true,
    message: "Password updated successfully",
  });
});

export let updateProfilePic = asyncWrapper(async (req, res, next) => {
  let file = req.file;
  if (!file) {
    return next(createError("Please provide a picture to update", 400));
  }
  let user = await User.findById(req.user._id);
  let imgToDelete = user.profilePicture?.public_id;
  let toUpload = await getDataUri(file);
  let img = await cloudinary.v2.uploader.upload(toUpload.content);
  user.profilePicture = {
    public_id: img.public_id,
    url: img.secure_url,
  };
  await user.save();
  if (imgToDelete) {
    await cloudinary.v2.uploader.destroy(imgToDelete);
  }
  res.json({
    success: true,
    message: "Profile picture updated successfully",
  });
});

export let updateProfilePoster = asyncWrapper(async (req, res, next) => {
  let file = req.file;
  if (!file) {
    return next(createError("Please provide a picture to update", 400));
  }
  let user = await User.findById(req.user._id);
  let imgToDelete = user.posterPicture?.public_id;
  let toUpload = await getDataUri(file);
  let img = await cloudinary.v2.uploader.upload(toUpload.content);
  user.posterPicture = {
    public_id: img.public_id,
    url: img.secure_url,
  };
  await user.save();
  if (imgToDelete) {
    await cloudinary.v2.uploader.destroy(imgToDelete);
  }
  res.json({
    success: true,
    message: "Profile banner updated successfully",
  });
});

export let deleteProfilePic = asyncWrapper(async (req, res, next) => {
  let user = await User.findById(req.user._id);
  let imgToDelete = user.profilePicture?.public_id;
  user.profilePicture = {};
  await user.save();
  if (imgToDelete) {
    await cloudinary.v2.uploader.destroy(imgToDelete);
  }
  res.json({
    success: true,
    message: "Profile picture deleted successfully",
  });
});

export let deleteProfilePoster = asyncWrapper(async (req, res, next) => {
  let user = await User.findById(req.user._id);
  let imgToDelete = user.posterPicture?.public_id;
  user.posterPicture = {};
  await user.save();
  if (imgToDelete) {
    await cloudinary.v2.uploader.destroy(imgToDelete);
  }
  res.json({
    success: true,
    message: "Profile banner deleted successfully",
  });
});

export let forgotPassword = asyncWrapper(async (req, res, next) => {
  let { email } = req.body;
  if (!email) {
    return next(createError("Please enter an email", 422));
  }
  let user = await User.findOne({ email });
  if (!user) {
    return next(createError("Invalid email id", 401));
  }
  let resetToken = await user.getResetToken();
  let url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  let message = `Hey, ${user.name}, \nPlease follow the link below to update the password: \n ${url}`;
  sendMail(user.email, message, "Please reset your password");
  res.json({
    success: true,
    message: "Reset password link sent to your email",
  });
});

export let resetPassword = asyncWrapper(async (req, res, next) => {
  let { password } = req.body;
  let { token } = req.params;
  if (!password) {
    return next(createError("Please enter a new password", 400));
  }
  if (!token) {
    return next(
      createError("Reset password link is either invalid or expired", 400)
    );
  }
  let resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  let user = await User.findOne({ resetPasswordToken });
  if (!user) {
    return next(
      createError("Reset password link is either invalid or expired", 400)
    );
  }
  if (user.resetTokenExpiry < Date.now()) {
    return next(
      createError("Reset lol password link is either invalid or expired", 400)
    );
  }
  user.password = password;
  await user.save();
  res.json({
    success: true,
    message: "Password updated successfully",
  });
});

export let updateEmail = asyncWrapper(async (req, res, next) => {
  let { newEmail } = req.body;
  if (!newEmail) {
    return next(createError("Please enter a new email id to update", 400));
  }
  if (newEmail == req.user.email) {
    return next(createError("Please enter a new email to update", 400));
  }
  let user = await User.findOne({ email: newEmail });
  if (user) {
    return next(createError("Email is already in use by another user", 400));
  }
  user = await User.findById(req.user._id);
  user.email = newEmail;
  await user.save();
  res.json({
    success: true,
    message: "Email updated successful",
  });
});

export let updateUsername = asyncWrapper(async (req, res, next) => {
  let { newUsername } = req.body;
  if (!newUsername) {
    return next(createError("Please enter a new email id to update", 400));
  }
  if (newUsername == req.user.username) {
    return next(createError("Please enter a new username to update", 400));
  }
  let user = await User.findOne({ username: newUsername });
  if (user) {
    return next(createError("Username is already in use by another user", 400));
  }
  user = await User.findById(req.user._id);
  user.username = newUsername;
  await user.save();
  res.json({
    success: true,
    message: "Username updated successful",
  });
});

export let deleteMyAccount = asyncWrapper(async (req, res, next) => {
  let { password } = req.body;
  if (!password) {
    return next(
      createError("Please enter your password to delete your account", 400)
    );
  }
  let user = await User.findById(req.user._id).select("+password");
  let isMatched = await user.verifyPassword(password);
  if (!isMatched) {
    return next(createError("Incorrect Password", 403));
  }
  if (user?.profilePicture?.public_id) {
    await cloudinary.v2.uploader.destroy(user?.profilePicture?.public_id);
  }
  if (user?.profilePicture?.public_id) {
    await cloudinary.v2.uploader.destroy(user?.profilePicture?.public_id);
  }
  await User.findByIdAndDelete(req.user._id);
  res.status(202).cookie("token", "", options).json({
    success: true,
    message: "Your account has been deleted successfully",
  });
});

export let getUserDetails = asyncWrapper(async (req, res, next) => {
  let { username } = req.params;
  let user = await User.findOne({ username }).select(
    "-resetPasswordToken -resetTokenExpiry"
  );
  if (!user) {
    return next(createError("User not found", 404));
  }
  user.profileViews = user.profileViews + 1;
  await user.save();
  return res.json({
    success: true,
    user,
  });
});

export let getBasicUserDetails = asyncWrapper(async (req, res, next) => {
  let { username } = req.params;
  let user = await User.findOne({ username }).select(
    "name username profilePicture bio _id"
  );
  if (!user) {
    return next(createError("User not found", 404));
  }
  return res.json({
    success: true,
    user,
  });
});

export let searchUser = asyncWrapper(async (req, res, next) => {
  let { keyword, limit } = req.query;
  if (!keyword) keyword = "";
  if (!limit) limit = 10;
  let users = await User.find({
    $or: [
      {
        username: { $regex: keyword, $options: "i" },
      },
      {
        name: { $regex: keyword, $options: "i" },
      },
      {
        bio: { $regex: keyword, $options: "i" },
      },
    ],
  })
    .select("name username profilePicture bio _id email")
    .sort("-profileViews")
    .limit(limit);
  res.json({
    success: true,
    users,
    numUsers: users.length,
  });
});

export let followUser = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  if (!id) {
    return next(createError("User not found", 404));
  }
  let user = await User.findById(id);
  if (!user) {
    return next(createError("User not found", 404));
  }
  if (user.username === req.user.username) {
    return next(createError("You cannot follow yourself", 404));
  }
  let myProfile = await User.findById(req.user._id);
  let isPresentAlready = myProfile.following.some((ele) => ele.equals(id));
  if (isPresentAlready) {
    return next(createError("You are already following the user", 400));
  }
  myProfile.following.push(user._id);
  user.followers.push(myProfile._id);
  await myProfile.save();
  await user.save();
  res.json({
    success: true,
    message: "User followed successfully",
  });
});

export let unfollowUser = asyncWrapper(async (req, res, next) => {
  let { id } = req.params;
  if (!id) {
    return next(createError("User not found", 404));
  }
  let user = await User.findById(id);
  if (!user) {
    return next(createError("User not found", 404));
  }
  let myProfile = await User.findById(req.user._id);
  let isPresent = myProfile.following.some((ele) => ele.equals(id));
  if (!isPresent) {
    return next(createError("You are not following the user", 400));
  }
  myProfile.following = myProfile.following.filter((ele) => !ele.equals(id));
  user.followers = user.followers.filter((ele) => !ele.equals(myProfile._id));
  await myProfile.save();
  await user.save();
  res.json({
    success: true,
    message: "User unfollowed successfully",
  });
});
