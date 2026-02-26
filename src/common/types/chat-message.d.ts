import { Message, ToolCall } from 'ollama'

export interface ChatMessage extends Pick<Message, 'role' | 'content' | 'thinking'> {
  uuid: string
  createdAt: string
  chatUuid: string
  toolCalls?: ToolCall[]
  thinkingTime?: number | null
  metadata?: Record<string, unknown> | null
}
