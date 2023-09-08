import { ObjectId, WithId } from 'mongodb'
import databaseServices from './database.service'
import Bookmark from '~/models/schemas/bookmark.schema'

class BookmarkSerive {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseServices.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Bookmark({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
    return result.value as WithId<Bookmark>
  }

  async unBookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseServices.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    return result
  }
}

const bookmarkService = new BookmarkSerive()
export default bookmarkService
