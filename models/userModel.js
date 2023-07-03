import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

let userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 50,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minLength: 2,
    maxLength: 15,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: validator.isEmail,
  },
  password: {
    type: String,
    required: true,
    minLength: [8, "Password must be longer"],
    select: false,
  },
  bio: String,
  location: {
    type: String,
    default: "Somewhere in the universe",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  profilePicture: {
    public_id: String,
    url: String,
  },
  posterPicture: {
    public_id: String,
    url: String,
  },
  website: String,
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  tweets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet",
    },
  ],
  retweets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet",
    },
  ],
  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet",
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet",
    },
  ],
  replies: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
      },
      originalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
      },
    },
  ],
  role: {
    type: String,
    enum: ["user", "admin", "owner"],
    default: "user",
  },
  profileViews: {
    type: Number,
    default: 0,
  },
  subscription: {
    status: {
      type: String,
      default: "inactive",
      enum: ["active", "inactive", "tick"],
    },
    id: String,
  },
  verifiedType: {
    // black for admin, blue for paid and default ...
    type: String,
    enum: ["blue", "gold", "grey", "black"],
    default: "blue",
  },
  resetPasswordToken: String,
  resetTokenExpiry: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.getJWT = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "15d",
  });
};
userSchema.methods.verifyPassword = async function (pass) {
  let isMatch = await bcrypt.compare(pass, this.password);
  return isMatch;
};
userSchema.methods.getResetToken = async function () {
  let token = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
  await this.save();
  return token;
};
export default mongoose.model("User", userSchema);
