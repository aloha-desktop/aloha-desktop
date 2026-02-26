export interface Chat {
  uuid: string
  name: string
  createdAt: string
}

export interface ChatListItem extends Chat {
  messageCount: number
}
