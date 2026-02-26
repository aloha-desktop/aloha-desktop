import { createChat as createChatStorage, DEFAULT_CHAT_NAME } from '../storage/chat-crud'
import { Chat } from '@common/types/chat'
import { createMessage } from './create-message'

export async function createChat(prompt: string): Promise<Chat | undefined> {
  const chat = createChatStorage(DEFAULT_CHAT_NAME)

  if (!chat) {
    throw new Error('Failed to create chat')
  }

  createMessage(prompt, chat.uuid)

  return chat
}
