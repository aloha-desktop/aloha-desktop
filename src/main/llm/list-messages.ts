import { getMessages } from '../storage/messages-crud'
import { ChatMessage } from '@common/types/chat-message'

export async function listMessages(chatUuid: string): Promise<ChatMessage[]> {
  return getMessages(chatUuid)
}
