import express from 'express'
import {getTrendingTags} from '../controllers/otherController.js'

let router = express.Router()

router.route('/trending').get(getTrendingTags)

export default router