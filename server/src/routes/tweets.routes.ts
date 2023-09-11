import { Router } from 'express'
import {
  createTweetControlle,
  getNewFeedsController,
  getTweetDetailChildrenController,
  getTweetDetailController
} from '~/controllers/tweets.controller'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator,
  tweetIdValidator
} from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isUserLoginValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

tweetsRouter.post(
  '/create',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetControlle)
)

tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoginValidator(accessTokenValidator),
  isUserLoginValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetDetailController)
)

tweetsRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  getTweetChildrenValidator,
  paginationValidator,
  isUserLoginValidator(accessTokenValidator),
  isUserLoginValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetDetailChildrenController)
)

tweetsRouter.get(
  '/',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsController)
)

export default tweetsRouter
