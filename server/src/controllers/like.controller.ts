import { NextFunction, Request, Response } from "express"
import { LIKE_MESSAGES } from "~/constants/message"
import { TokenPayload } from "~/models/requests/user.requerst"
import likeSevice from "~/services/like.service"

export const likeTweetController = async(req: Request, res: Response, next: NextFunction) => {
    const {user_id} = req.decoded_authorization as TokenPayload
    const result = await likeSevice.likeTweet(user_id, req.body.tweet_id)
    return res.json({
        message: LIKE_MESSAGES.LIKE_SUCCESSFULLY,
        result
    })
}

export const unlikeTweetController = async(req: Request, res: Response) => {
    const {user_id} = req.decoded_authorization as TokenPayload
    const result = await likeSevice.unlikeTweet(user_id, req.params.tweet_id)
    res.json({
        message: LIKE_MESSAGES.UNLIKE_SUCCESSFULLY,
        result
    })
}