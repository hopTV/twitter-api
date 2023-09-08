import { NextFunction, Request, Response } from 'express'
import { BOOKMARK_MESSAGES } from '~/constants/message'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/user.requerst'
import bookmarkService from '~/services/bookmark.service'
import { BookmarkTweetReqBody } from '~/models/requests/bookmarks.requerst'

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  console.log(req.body.tweet_id)

  const result = await bookmarkService.bookmarkTweet(user_id, req.body.tweet_id)
  return res.json({
    message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESSFULLY,
    result
  })
}

export const unBookmarkTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = bookmarkService.unBookmarkTweet(user_id, req.params.tweet_id)
}
