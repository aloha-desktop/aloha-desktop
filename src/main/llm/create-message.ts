import { ChatMessage } from '@common/types/chat-message'
import { createMessage as createMessageStorage } from '../storage/messages-crud'

export async function createMessage(content: string, chatUuid: string): Promise<ChatMessage> {
  return createMessageStorage(null, 'user', content, chatUuid)
}
