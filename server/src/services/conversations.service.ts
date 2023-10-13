import { ObjectId } from 'mongodb'
import databaseServices from './database.service'

class ConversationService {
  async getConversations({
    sender_id,
    receiver_id,
    limit,
    page
  }: {
    sender_id: string
    receiver_id: string
    limit: number
    page: number
  }) {
    const match = {
      $or: [
        { sender_id: new ObjectId(sender_id), receiver_id: new ObjectId(receiver_id) },
        { sender_id: new ObjectId(receiver_id), receiver_id: new ObjectId(sender_id) }
      ]
    }

    const conversation = await databaseServices.conversations
      .find(match)
      .sort({ created_at: -1 })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray()

    const total = await databaseServices.conversations.countDocuments(match)

    return {
      conversation,
      total
    }
  }
}

const conversationService = new ConversationService()
export default conversationService
