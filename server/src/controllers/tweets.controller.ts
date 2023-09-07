import { NextFunction, Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/user.requerst'
import tweetsService from '~/services/tweets.service'

export const createTweetControlle = async (req: Request, res: Response, next: NextFunction) => {
    const {user_id} = req.decoded_authorization as TokenPayload
   const result = await tweetsService.createTweet(user_id, req.body)
   return res.json({
    message: "Create Tweet successfully",
    result 
   })
}
