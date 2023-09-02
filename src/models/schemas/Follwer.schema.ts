import { ObjectId } from "mongodb"

interface FollowType {
    _id?: ObjectId
    user_id: ObjectId
    followed_user_id: ObjectId
    created_at?: Date
  }
  
  export default class Follower {
    _id?: ObjectId
    user_id: ObjectId
    followed_user_id: ObjectId
    created_at?: Date
  
    constructor({ _id, followed_user_id, created_at, user_id }: FollowType) {
      this._id = _id
      this.created_at = created_at || new Date()
      this.followed_user_id = followed_user_id
      this.user_id = user_id
      
    }
  }
  