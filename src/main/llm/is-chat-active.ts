import { activeChats } from './active-chats'

export function isChatActive(chatUuid: string): boolean {
  return activeChats.has(chatUuid)
}
