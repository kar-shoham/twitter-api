import asyncWrapper from "../middlewares/asyncWrapper.js";
import Hashtag from "../models/hashtagModel.js";

export let getTrendingTags = asyncWrapper(async(req, res, next) => {
    let {limit} = req.query
    if(!limit) limit = 7
    let hashtags = await Hashtag.find({}).sort('-count').limit(limit)
    res.json({
        success: true,
        message: 'Here are the trending topics',
        hashtags
    })
})
