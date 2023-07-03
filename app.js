import cookieParser from "cookie-parser";
import express from "express";
import errorHandler from "./middlewares/errorMiddleware.js";
import userRoute from './router/userRouter.js'
import tweetRoute from './router/tweetRouter.js'

let app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1', userRoute)
app.use('/api/v1', tweetRoute)


app.use(errorHandler);
export default app;
