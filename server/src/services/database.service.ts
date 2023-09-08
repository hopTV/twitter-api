import { MongoClient, Db, Collection } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Hashtag from '~/models/schemas/hashtags.schema'
import Tweet from '~/models/schemas/tweets.schema'
import Bookmark from '~/models/schemas/bookmark.schema'
import Like from '~/models/schemas/like.shema'

config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.dhrommo.mongodb.net/?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri)

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (err) {
      console.log(err)
      throw err
    }
  }

  async indexUsers() {
    const exists = await this.users.indexExists(['email_1_password_1', 'email_1', 'username_1'])

    if (!exists) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }

  async indexRefreshToken() {
    const exists = await this.refreshTokens.indexExists(['exp_1', 'token_1'])
    if (!exists) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex(
        { exp: 1 },
        {
          expireAfterSeconds: 0
        }
      )
    }
  }

  get users(): Collection<User> {
    return this.db.collection('users')
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection('refresh_token')
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection('hashtags')
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection('tweets')
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection('bookmarks')
  }
  get likes(): Collection<Like> {
    return this.db.collection('likes')
  }
}

const databaseServices = new DatabaseService()

export default databaseServices
