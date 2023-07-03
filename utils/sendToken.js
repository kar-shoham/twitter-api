let sendToken = async (user, message, statusCode, res) => {
  let token = await user.getJWT();
  let options = {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };
  res.status(statusCode).cookie("token", token, options).json({
    message,
  });
};

export default sendToken;
