import { randomUUID } from 'node:crypto'
import { getInstance, TableInfo } from './instance'
import { ChatMessage } from '@common/types/chat-message'
import { ToolCall } from 'ollama'

type DBMessage = {
  uuid: string
  role: string
  content: string
  thinking: string | null
  thinkingTime: number | null
  toolCalls: string
  createdAt: string
  chatUuid: string
  metadata: string | null
  model: string | null
}

const schema: Record<keyof DBMessage, string> = {
  uuid: 'TEXT NOT NULL', // In SQLite, you cannot add a PRIMARY KEY column after the table is created
  role: 'TEXT',
  content: 'TEXT',
  thinking: 'TEXT',
  thinkingTime: 'INTEGER',
  toolCalls: 'TEXT',
  createdAt: 'TEXT',
  chatUuid: 'TEXT REFERENCES chats(uuid)',
  metadata: 'TEXT',
  model: 'TEXT',
}

export function prepare(): void {
  const db = getInstance()
  db.prepare('CREATE TABLE IF NOT EXISTS messages (uuid TEXT PRIMARY KEY NOT NULL)').run()

  const existingColumns = (db.pragma('table_info(messages)') as TableInfo[]).map(({ name }) => name)

  Object.entries(schema).forEach(([name, type]) => {
    if (!existingColumns.includes(name)) {
      db.prepare(`ALTER TABLE messages ADD COLUMN ${name} ${type}`).run()
    }
  })
}

export function createMessage(
  model: string | null,
  role: string,
  content: string,
  chatUuid: string,
  metadata: Record<string, unknown> | null = null
): ChatMessage {
  const uuid = randomUUID()

  getInstance()
    .prepare(
      'INSERT INTO messages (uuid, role, content, createdAt, chatUuid, metadata, model) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(uuid, role, content, new Date().toISOString(), chatUuid, metadata ? JSON.stringify(metadata) : null, model)

  return getMessage(uuid)! // we know it exists
}

export function saveMessageContent(
  uuid: string,
  content: string,
  thinking: string | null,
  thinkingTime: number | null,
  toolCalls: ToolCall[] | null,
  metadata: Record<string, unknown> | null = null
): ChatMessage | undefined {
  getInstance()
    .prepare(
      'UPDATE messages SET content = ?, thinking = ?, toolCalls = ?, thinkingTime = ?, metadata = ? WHERE uuid = ?'
    )
    .run(
      content,
      thinking,
      toolCalls?.length ? JSON.stringify(toolCalls) : null,
      thinkingTime,
      metadata ? JSON.stringify(metadata) : null,
      uuid
    )
  return getMessage(uuid)
}

export function getMessage(uuid: string): ChatMessage | undefined {
  const msg = getInstance().prepare<[string], DBMessage>('SELECT * FROM messages WHERE uuid = ?').get(uuid)
  if (!msg) return undefined
  return {
    uuid: msg.uuid,
    role: msg.role,
    content: msg.content,
    thinking: msg.thinking || undefined,
    thinkingTime: msg.thinkingTime,
    toolCalls: msg.toolCalls ? JSON.parse(msg.toolCalls) : null,
    createdAt: msg.createdAt,
    chatUuid: msg.chatUuid,
    metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
  }
}

export function getMessages(chatUuid: string): ChatMessage[] {
  const stmt = getInstance().prepare<[string], DBMessage>('SELECT * FROM messages WHERE chatUuid = ?')

  const messages = [] as ChatMessage[]

  for (const msg of stmt.iterate(chatUuid)) {
    messages.push({
      uuid: msg.uuid,
      role: msg.role,
      content: msg.content,
      thinking: msg.thinking || undefined,
      thinkingTime: msg.thinkingTime,
      toolCalls: msg.toolCalls ? JSON.parse(msg.toolCalls) : null,
      createdAt: msg.createdAt,
      chatUuid: msg.chatUuid,
      metadata: msg.metadata ? JSON.parse(msg.metadata) : null,
    })
  }

  return messages
}
