import Hashtag from '~/models/schemas/hashtags.schema'
import databaseServices from './database.service'
import { ObjectId, WithId } from 'mongodb'
import { TweetRequestBody } from '~/models/requests/tweet.requerst'
import Tweet from '~/models/schemas/tweets.schema'
import { TweetType } from '~/constants/enums'
import { StringModule } from '@faker-js/faker'

class TweetsService {
  async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocument = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseServices.hashtags.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: new Hashtag({ name: hashtag }) },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )

    return hashtagDocument.map((hashtag) => (hashtag.value as WithId<Hashtag>)._id)
  }

  async createTweet(user_id: string, body: TweetRequestBody) {
    const hashtags = await this.checkAndCreateHashtags(body.hashtags)
    const result = await databaseServices.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags,
        mentions: body.mentions,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )

    const tweet = await databaseServices.tweets.findOne({ _id: result.insertedId })
    return tweet
  }

  async increaseView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseServices.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    )

    return result.value as WithId<{
      guest_views: number
      user_views: number
      updated_at: Date
    }>
  }

  async getTweetChildren({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  }: {
    tweet_id: string
    tweet_type: TweetType
    limit: number
    page: number
    user_id: string
  }) {
    const tweets = await databaseServices.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
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
            comment_count: {
              $size: {
                $filter: {
                  input: '$tweet_child',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Comment]
                  }
                }
              }
            },
            reTweet_count: {
              $size: {
                $filter: {
                  input: '$tweet_child',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Retweet]
                  }
                }
              }
            },
            quote_count: {
              $size: {
                $filter: {
                  input: '$tweet_child',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.QuoteTweet]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            tweet_child: 0
          }
        },
        { $skip: limit * (page - 1) },
        { $limit: limit }
      ])
      .toArray()

    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()

    const [, total] = await Promise.all([
      databaseServices.tweets.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      ),
      await databaseServices.tweets.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      })
    ])

    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })

    return { tweets, total }
  }

  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const followed_user_ids = await databaseServices.followers.find(
      { user_id: new ObjectId(user_id) },
      {
        projection: {
          followed_user_id: 1,
          _id: 0
        }
      }
    ).toArray()

    const ids = followed_user_ids.map((item) => item.followed_user_id)
    
    // mong muốn newFees sẽ lấy luôn cả tweet của mình
    ids.push(new ObjectId(user_id))

    const [tweets, total] = await Promise.all([
      databaseServices.tweets.aggregate([
        {
          $match: {
            user_id: {
              $in: ids
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
           path: '$user'
          }
        },
        {
          $match: {
            $or: [
              {
                audience: 0
              },
              {
                $and: [
                  {audience: 1},
                  {
                    'user.twitter_circle': {
                      $in: [new ObjectId(user_id)]
                    }
                  }
                ]
              }
            ]
          }
        },
         {
          $skip: limit * (page -1)
        }, 
        {
          $limit: limit
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
                  username: '$$mention.username',
                  email: '$$mention.email'
                }
              }
            }
          }
        }, 
        {
          $lookup: {
            form: 'bookmarks',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        {
          $lookup: {
            form: 'likes',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'likes'
          }
        },
        {
          $lookup: {
            form: 'tweets', 
            localField: '_id',
            foreignField: 'parent_id',
            as: 'tweet_child',
          }
        }, 
        {
          $addFields: {
            bookmarks: {
              $size: '$bookmarks',

            }, 
            likes: {
              $size: '$likes'
            }, 
              retweet_count: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Retweet]
                    }
                  }
                }
              },
              comment_count: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Comment]
                    }
                  }
                }
              },
              quote_count: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.QuoteTweet]
                    }
                  }
                }
              }
          }
        },
        {
          $project: {
            tweet_child: 0,
            user: {
              password: 0,
              email_verify_token: 0,
              forgot_password_token: 0,
              twitter_circle: 0,
              date_of_birth: 0
            }
          }
        }
      ]).toArray(),
      databaseServices.tweets.aggregate([
        {
          $match: {
            user_id: {
              $in: ids
            }
        }
      },
      {
        $lookup: {
          form: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user'
        }
      }, 
      {
        $match: {
          $or: [
            {
            audience: 0
          },
          {
            $and: [
              {
                audience: 1
            },
            {
              'user.twitter_circle': {
                $in: [new ObjectId(user_id)]
              }
            }
          ]
          }
        ]
        }
      },
      {
        $count: 'total'
      }
      ]).toArray()
    ])


    const tweet_ids = tweets.map((tweet) => tweet._id)
    const date = new Date()
    await databaseServices.tweets.updateMany(
      {
        _id: {
          $in: tweet_ids
        }
      },
      {
        $inc: {user_views: 1},
        $set: {
          updated_at: date
        }
      }
    )

      tweets.forEach((tweet) => {
        tweet.updated_at = date
        tweet.user_views += 1
      })
      return {
        tweets,
        total: total[0]?.total || 0
      }
  }
}

const tweetsService = new TweetsService()
export default tweetsService
