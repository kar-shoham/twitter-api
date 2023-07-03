import express, { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getMyLikes,
  getMyReplies,
  getMyRetweets,
  getMyTweets,
  getTweet,
  getUserFeed,
  getUserLikedPosts,
  getUserReplies,
  getUserRetweets,
  replyTweet,
  toggleBookmarkTweet,
  toggleLikeTweet,
  toggleRetweetTweet,
  updateTweet,
} from "../controllers/tweetController.js";
import {
  authenticate,
  verifyAdmin,
  verifySubscription,
} from "../middlewares/auth.js";
import singleUpload from "../middlewares/singleUpload.js";
import { deleteUserTweet } from "../controllers/adminController.js";

let router = express.Router();

router.route("/tweet").post(authenticate, singleUpload, createTweet);
router
  .route("/tweet/:id")
  .delete(authenticate, deleteTweet)
  .get(getTweet)
  .post(authenticate, replyTweet)
  .patch(authenticate, verifySubscription, singleUpload, updateTweet);

router.route("/tweet/like/:id").patch(authenticate, toggleLikeTweet);
router.route("/tweet/bookmark/:id").patch(authenticate, toggleBookmarkTweet);
router.route("/tweet/retweet/:id").patch(authenticate, toggleRetweetTweet);


router.route('/me/posts').get(authenticate, getMyTweets)
router.route('/me/likes').get(authenticate, getMyLikes)
router.route('/me/retweets').get(authenticate, getMyRetweets)
router.route('/me/replies').get(authenticate, getMyReplies)


router.route('/user/tweets/:id').get(getUserFeed)
router.route('/user/likes/:id').get(getUserLikedPosts)
router.route('/user/retweets/:id').get(getUserRetweets)
router.route('/user/replies/:id').get(getUserReplies)


router
  .route("/admin/tweet/:id")
  .delete(authenticate, verifyAdmin, deleteUserTweet);

export default router;
