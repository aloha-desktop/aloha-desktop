import { getChats } from '../storage/chat-crud'
import { ChatListItem } from '@common/types/chat'

export async function listChats(): Promise<ChatListItem[]> {
  return getChats()
}
