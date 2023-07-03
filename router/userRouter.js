import express from "express";
import singleUpload from "../middlewares/singleUpload.js";
import {
  deleteMyAccount,
  deleteProfilePic,
  deleteProfilePoster,
  followUser,
  forgotPassword,
  getBasicUserDetails,
  getMyProfile,
  getUserDetails,
  login,
  logout,
  register,
  resetPassword,
  searchUser,
  unfollowUser,
  updateEmail,
  updatePassword,
  updateProfile,
  updateProfilePic,
  updateProfilePoster,
  updateUsername,
} from "../controllers/userController.js";
import { authenticate, verifyAdmin } from "../middlewares/auth.js";
import { deleteUser, getAllUsers, giveTick, makeAdmin } from "../controllers/adminController.js";

let router = express.Router();

router.route("/register").post(singleUpload, register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/me").get(authenticate, getMyProfile);
router.route("/updateprofile").patch(authenticate, updateProfile);
router.route("/updatepassword").patch(authenticate, updatePassword);
router
  .route("/updateprofilepic")
  .patch(authenticate, singleUpload, updateProfilePic);
router
  .route("/updateprofileposter")
  .patch(authenticate, singleUpload, updateProfilePoster);
router.route("/deleteprofilepic").delete(authenticate, deleteProfilePic);
router.route("/deleteprofileposter").delete(authenticate, deleteProfilePoster);
router.route("/forgotpassword").post(forgotPassword);
router.route("/resetpassword/:token").patch(resetPassword);
router.route("/updateemail").patch(authenticate, updateEmail);
router.route("/updateusername").patch(authenticate, updateUsername);
router.route("/deleteaccount").delete(authenticate, deleteMyAccount);

router.route("/user/:username").get(getUserDetails);
router.route('/user/basic/:username').get(getBasicUserDetails)
router.route('/user').get(searchUser)
router.route('/follow/:id').patch(authenticate, followUser)
router.route('/unfollow/:id').patch(authenticate, unfollowUser)

router.route("/admin/users").get(authenticate, verifyAdmin, getAllUsers);
router.route("/admin/user/:id").delete(authenticate, verifyAdmin, deleteUser);
router.route("/admin/givetick/:id").patch(authenticate, verifyAdmin, giveTick);
router.route("/admin/user/makeadmin/:id").patch(authenticate, verifyAdmin, makeAdmin);


export default router;
