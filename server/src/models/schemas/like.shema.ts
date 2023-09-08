import { ObjectId } from "mongodb"

interface LikeType {
    _id?: ObjectId
    user_id: ObjectId
    tweet_id: ObjectId
    created_at?: Date
}

export default class Like {
    _id: ObjectId
    user_id: ObjectId
    tweet_id: ObjectId
    created_at?: Date

    constructor({_id, user_id, tweet_id, created_at}: LikeType) {
        this._id = new ObjectId(_id)
        this.user_id = new ObjectId(user_id)
        this.tweet_id = new ObjectId(tweet_id)
        this.created_at = created_at || new Date()
    }
}