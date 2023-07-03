let errorHandler = (err, req, res, next) => {
  if (!err.message) err.message = "Internal Server Error";
  if (!err.statusCode) err.statusCode = 500;
  // console.log(err);
  if (
    err.message.startsWith(
      "E11000 duplicate key error collection: twitter.users index: username_1 dup key: { username:"
    )
  ) {
    err.message = "Username already exists";
    err.statusCode = 409;
  }
  if (
    err.message.startsWith(
      "E11000 duplicate key error collection: twitter.users index: email_1 dup key: { email:"
    )
  ) {
    err.message = "Email is already registered";
    err.statusCode = 409;
  }
  if (
    err.message === "User validation failed: password: Password must be longer"
  ) {
    err.message = "Please enter a longer password";
    err.status = 400;
  }

  let path = err?.errors?.name?.properties?.path;
  let type = err?.errors?.name?.properties?.type;
  if (type === "maxlength") {
    err.message = `${path} must be shorter`;
  }
  if (type === "minlength") {
    err.message = `${path} must be longer`;
  }

  if(err.message.startsWith("Cast to ObjectId failed for value")){
    err.message = 'Not Found'
    err.statusCode = 404
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export default errorHandler;
