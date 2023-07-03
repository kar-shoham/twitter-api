import User from "../models/userModel.js";
import { createError } from "../utils/errorClass.js";
import asyncWrapper from "./asyncWrapper.js";
import jwt from "jsonwebtoken";

export let authenticate = asyncWrapper(async (req, res, next) => {
  let { token } = req.cookies;
  if (!token) {
    return next(createError("Please login to access this resource"));
  }
  let { id } = jwt.verify(token, process.env.JWT_SECRET_KEY);
  if (!id) {
    return next(createError("Please login to access this resource"));
  }
  let user = await User.findById(id);
  if (!user) {
    return next(createError("Please login to access this resource"));
  }
  req.user = user;
  next();
});


export let verifyAdmin = asyncWrapper(async(req, res, next) => {
  let user = await User.findById(req.user._id)
  if(user.role === 'user'){
    return next(createError('Only admin can access this resource'))
  }
  next()
})


export let verifySubscription = asyncWrapper(async(req, res, next) => {
  let user = await User.findById(req.user._id)
  if(user.subscription.status === 'inactive'){
    return next(createError('Only verified users can edit tweets', 400))
  }
  next()
})

export let verifyOwner = asyncWrapper(async(req, res, next) => {
  let user = await User.findById(req.user._id)
  if(user.role !== 'owner'){
    return next(createError('Only OWNER can access this resource'))
  }
  next()
})