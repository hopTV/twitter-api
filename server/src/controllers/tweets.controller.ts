import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetType } from '~/constants/enums'
import { Pagination, TweetParam, TweetQuery, TweetRequestBody } from '~/models/requests/tweet.requerst'
import { TokenPayload } from '~/models/requests/user.requerst'
import tweetsService from '~/services/tweets.service'

export const createTweetControlle = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body)
  return res.json({
    message: 'Create Tweet successfully',
    result
  })
}

export const getTweetDetailController = async (req: Request, res: Response) => {
  const result = await tweetsService.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    updates_at: result.updated_at
  }
  return res.json({
    message: 'Get tweet Successfully',
    result: tweet
  })
}

export const getTweetDetailChildrenController = async (
  req: Request<TweetParam, any, any, TweetQuery>,
  res: Response
) => {
  const tweet_type = Number(req.query.tweet_type as string) as TweetType
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const { user_id } = req.decoded_authorization as TokenPayload

  const { tweets, total } = await tweetsService.getTweetChildren({
    tweet_id: req.params.tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  })

  return res.json({
    message: 'Get tweet children Successfully',
    result: {
      tweets,
      tweet_type,
      limit,
      page,
      total_page: Math.ceil((total as number) / limit)
    }
  })
}

export const getNewFeedsController = (req: Request<ParamsDictionary, any, any , Pagination>, res: Response) => {
    return res.json({
        message: 'Get New Feeds SuccessFully'
    })
}
