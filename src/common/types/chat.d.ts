export interface Chat {
  uuid: string
  name: string
  createdAt: string
  gatewayName: string | null
  gatewayChannel: string | null
}

export interface ChatListItem extends Chat {
  messageCount: number
}
