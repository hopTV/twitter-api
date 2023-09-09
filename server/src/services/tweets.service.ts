import Hashtag from "~/models/schemas/hashtags.schema"
import databaseServices from "./database.service"
import { ObjectId, WithId } from "mongodb"
import { TweetRequestBody } from "~/models/requests/tweet.requerst"
import Tweet from "~/models/schemas/tweets.schema"

class TweetsService {
    async checkAndCreateHashtags(hashtags: string[]) {
        const hashtagDocument = await Promise.all(hashtags.map((hashtag) => {
            return databaseServices.hashtags.findOneAndUpdate(
                {name: hashtag},
                {$setOnInsert: new Hashtag({name: hashtag})},
                {
                    upsert: true,
                    returnDocument: 'after'
                }
                )
        }))

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

        const tweet = await databaseServices.tweets.findOne({_id: result.insertedId})
        return tweet
    }

    async increaseView(tweet_id: string, user_id?: string) {
        const inc = user_id ? {user_views: 1} : {guest_views: 1}
        const result = await databaseServices.tweets.findOneAndUpdate(
            {_id: new ObjectId(tweet_id)},
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
    
}

const tweetsService = new TweetsService()
export default tweetsService