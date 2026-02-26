import { activeChats } from './active-chats'
import log from 'electron-log'

export function abortChat(chatUuid: string): void {
  try {
    activeChats.get(chatUuid)?.abort()
  } catch (error) {
    log.error('Failed to abort chat', error)
  }
}
