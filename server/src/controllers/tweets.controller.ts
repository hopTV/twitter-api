import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetRequestBody } from '~/models/requests/tweet.requerst'
import { TokenPayload } from '~/models/requests/user.requerst'
import tweetsService from '~/services/tweets.service'

export const createTweetControlle = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response, next: NextFunction) => {
    const {user_id} = req.decoded_authorization as TokenPayload
   const result = await tweetsService.createTweet(user_id, req.body)
   return res.json({
    message: "Create Tweet successfully",
    result 
   })
}

export const getTweetDetailController = async (req: Request, res:Response) => {
    const result = await tweetsService.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
    const tweet = {
        ...req.tweet,
        guest_views: result.guest_views,
        user_views: result.user_views,
        updates_at: result.updated_at
    }
    return res.json({
        message: "Get tweet Successfully",
        result: tweet
    })
}