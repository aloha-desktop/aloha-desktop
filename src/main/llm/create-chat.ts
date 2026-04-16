import { createChat as createChatStorage, DEFAULT_CHAT_NAME } from '../storage/chat-crud'
import { Chat } from '@common/types/chat'
import { createMessage } from './create-message'
import { windowEmitter } from '../window-emitter'

export async function createChat(
  prompt: string,
  gatewayName?: string,
  gatewayChannel?: string
): Promise<Chat | undefined> {
  const chat = createChatStorage(DEFAULT_CHAT_NAME, gatewayName, gatewayChannel)

  if (!chat) {
    throw new Error('Failed to create chat')
  }

  createMessage(prompt, chat.uuid)

  windowEmitter.emitToAllListeners('llm:chat-list-changed')

  return chat
}
