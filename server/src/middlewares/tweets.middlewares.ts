import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import httpStatus from '~/constants/httpStatus'
import { TWEETS_MESSAGES, userMessages } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/user.requerst'
import Tweet from '~/models/schemas/tweets.schema'
import databaseServices from '~/services/database.service'
import { numberEnumToArray } from '~/utils/common'
import { wrapRequestHandler } from '~/utils/handlers'
import { validate } from '~/utils/validation'

const tweetType = numberEnumToArray(TweetType)
const tweetAudiences = numberEnumToArray(TweetAudience)
const mediaTypes = numberEnumToArray(MediaType)

export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [tweetType],
          errorMessage: TWEETS_MESSAGES.INVALID_TYPE
        }
      },
      audience: {
        isIn: {
          options: [tweetAudiences],
          errorMessage: TWEETS_MESSAGES.INVALID_AUDIENCE
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            //nếu type là retweet, comment, quotetweet thì parent_id phải là tweet_id của tweet cha
            if (
              [TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
              !ObjectId.isValid(value)
            ) {
              throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
            }
            // nếu type là tweet thì parent_id phải null
            if (type === TweetType.Tweet && value !== null) {
              throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_NULL)
            }

            console.log(value, 'value')

            return true
          }
        }
      },
      content: {
        isString: true,
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            const hashtags = req.body.hashtags as string[]
            const mentions = req.body.mentions as string[]
            // nếu type là comment, quotetweet, tweet, và không có mentions và hashtags thì content phải là string và không được rỗng
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
              isEmpty(hashtags) &&
              isEmpty(mentions) &&
              value === ''
            ) {
              throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
            }
            // nếu type là retweet thì content phải là  ' '

            if (type === TweetType.Retweet && value !== '') {
              throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_EMPTY_STRING)
            }

            return true
          }
        }
      },
      hashtags: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // yêu cầu mỗi phần tử trong array là string
            if (value.some((item: any) => typeof item !== 'string')) {
              throw new Error(TWEETS_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING)
            }

            return true
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Yêu cầu mỗi phần từ trong array là user_id
            if (value.some((item: any) => !ObjectId.isValid(item))) {
              throw new Error(TWEETS_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID)
            }
            return true
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Yêu cầu mỗi phần từ trong array là Media Object
            if (
              value.some((item: any) => {
                return typeof item.url !== 'string' || !mediaTypes.includes(item.type)
              })
            ) {
              throw new Error(TWEETS_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const tweetIdValidator = validate(
  checkSchema({
    tweet_id: {
      custom: {
        options: async (value, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              message: TWEETS_MESSAGES.INVALID_TWEET_ID,
              status: httpStatus.BAD_REQUEST
            })
          }
          const [tweet] = await databaseServices.tweets.aggregate<Tweet>(
            [
              {
                $match: {
                  _id: new ObjectId(value)
                }
              },
              {
                $lookup: {
                  from: 'hashtags',
                  localField: 'hashtags',
                  foreignField: '_id',
                  as: 'hashtags'
                }
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'mentions',
                  foreignField: '_id',
                  as: 'mentions'
                }
              },
              {
                $addFields: {
                  mentions: {
                    $map: {
                      input: '$mentions',
                      as: 'mention',
                      in: {
                        _id: '$$mention._id',
                        name: '$$mention.name',
                        email: '$$mention.email'
                      }
                    }
                  }
                }
              },
              {
                $lookup: {
                  from: 'bookmarks',
                  localField: '_id',
                  foreignField: 'tweet_id',
                  as: 'bookmarks'
                }
              },
              {
                $lookup: {
                  from: 'likes',
                  localField: '_id',
                  foreignField: 'tweet_id',
                  as: 'likes'
                }
              },
              {
                $lookup: {
                  from: 'tweets',
                  localField: '_id',
                  foreignField: 'parent_id',
                  as: 'tweet_child'
                }
              },
              {
                $addFields: {
                  bookmarks: { $size: '$bookmarks' },
                  likes: { $size: '$likes' },
                  retweet_count: {
                    $size: {
                      $filter: {
                        input: '$tweet_child',
                        as: 'item',
                        cond: { $eq: ['$$item.type', 1] }
                      }
                    }
                  },
                  comment_count: {
                    $size: {
                      $filter: {
                        input: '$tweet_child',
                        as: 'item',
                        cond: { $eq: ['$$item.type', 2] }
                      }
                    }
                  },
                  quote_count: {
                    $size: {
                      $filter: {
                        input: '$tweet_child',
                        as: 'item',
                        cond: { $eq: ['$$item.type', 3] }
                      }
                    }
                  }
                }
              }
            ],
          ).toArray()
          if (!tweet) {
            throw new ErrorWithStatus({
              message: TWEETS_MESSAGES.TWEET_NOT_FOUND,
              status: httpStatus.NOT_FOUND
            })
          }

          ;(req as Request).tweet = tweet
          return true
        }
      }
    }
  })
)

// Muốn sử dụng async await trong handler express thì phải có try catch
// Nếu không dùng try catch thì phải dùng wrapRequestHandler

export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience === TweetAudience.TwitterCircle) {
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        message: userMessages.ACCESS_TOKEN_IS_REQUIRED,
        status: httpStatus.UNAUTHORIZED
      })
    }

    const author = await databaseServices.users.findOne({ _id: new ObjectId(tweet.user_id) })

    // kiểm tra tài khoản tác giả có ổn (bị khóa hay không)
    if (!author || author.verify === UserVerifyStatus.Banner) {
      throw new ErrorWithStatus({
        message: userMessages.USER_NOT_FOUND,
        status: httpStatus.FORBIDDEN
      })
    }

    const { user_id } = req.decoded_authorization as TokenPayload
    const isInTwitterCircle =
      author.twitter_circle && author.twitter_circle.some((user_circle_id) => user_circle_id.equals(user_id))

    // nếu bạn không phải là tác giả và không nằm trong twitter circle thì throw lỗi
    if (!author._id.equals(user_id) && !isInTwitterCircle) {
      throw new ErrorWithStatus({
        message: TWEETS_MESSAGES.TWEET_IS_NOT_PUBLIC,
        status: httpStatus.FORBIDDEN
      })
    }
  }

  next()
})

export const getTweetChildrenValidator = validate(
  checkSchema({
    tweet_type: {
      isIn: {
        options : [tweetType],
        errorMessage: TWEETS_MESSAGES.INVALID_TYPE
      }
    }
  }, ['query'])
)

export const paginationValidator = validate(
  checkSchema({
    limit: {
      isNumeric: true,
      custom: {
        options: async(value, {req}) => {
          const num = Number(value) 
          if(num > 100 || num < 1 ) {
            throw new Error('1 <= limit <= 100')
          }
          return true
        }
      }
    },
    page: {
      isNumeric: true,
      custom: {
        options: async(value, {req}) => {
          const num = Number(value) 
          if(num < 1 ) {
            throw new Error('page >= 1')
          }
          return true
        }
      }
    }
  }, ['query'])
)