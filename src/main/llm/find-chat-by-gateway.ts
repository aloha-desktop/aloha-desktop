import { Chat } from '@common/types/chat'
import { getChatByGatewayAndChannel } from '../storage/chat-crud'

export async function findChatByGatewayAndChannel(
  gatewayName: string,
  gatewayChannel: string
): Promise<Chat | undefined> {
  return getChatByGatewayAndChannel(gatewayName, gatewayChannel)
}
