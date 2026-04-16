import { randomUUID } from 'node:crypto'
import { getInstance, TableInfo } from './instance'
import { Chat, ChatListItem } from '@common/types/chat'

export const DEFAULT_CHAT_NAME = 'New Chat'

type DBChat = {
  uuid: string
  name: string
  createdAt: string
  gatewayName: string
  gatewayChannel: string
}

const schema: Record<keyof DBChat, string> = {
  uuid: 'TEXT NOT NULL', // In SQLite, you cannot add a PRIMARY KEY column after the table is created
  name: 'TEXT',
  createdAt: 'TEXT',
  gatewayName: 'TEXT',
  gatewayChannel: 'TEXT',
}

export function prepare(): void {
  const db = getInstance()
  db.prepare('CREATE TABLE IF NOT EXISTS chats (uuid TEXT PRIMARY KEY NOT NULL)').run()

  const existingColumns = (db.pragma('table_info(chats)') as TableInfo[]).map(({ name }) => name)

  Object.entries(schema).forEach(([name, type]) => {
    if (!existingColumns.includes(name)) {
      db.prepare(`ALTER TABLE chats ADD COLUMN ${name} ${type}`).run()
    }
  })
}

export function getChat(uuid: string): Chat | undefined {
  const chat = getInstance().prepare<[string], DBChat>('SELECT * FROM chats WHERE uuid = ?').get(uuid)
  if (!chat) return undefined
  return {
    uuid: chat.uuid,
    name: chat.name,
    createdAt: chat.createdAt,
    gatewayName: chat.gatewayName,
    gatewayChannel: chat.gatewayChannel,
  }
}

/** If multiple rows match, returns the chat with the latest createdAt. */
export function getChatByGatewayAndChannel(gatewayName: string, gatewayChannel: string): Chat | undefined {
  const chat = getInstance()
    .prepare<[string, string], DBChat>(
      `SELECT * FROM chats 
       WHERE gatewayName = ? AND gatewayChannel = ?
       ORDER BY createdAt DESC LIMIT 1`
    )
    .get(gatewayName, gatewayChannel)
  if (!chat) return undefined
  return {
    uuid: chat.uuid,
    name: chat.name,
    createdAt: chat.createdAt,
    gatewayName: chat.gatewayName,
    gatewayChannel: chat.gatewayChannel,
  }
}

export function updateChatName(uuid: string, name: string): void {
  getInstance().prepare('UPDATE chats SET name = ? WHERE uuid = ?').run(name, uuid)
}

export function createChat(name: string, gatewayName?: string, gatewayChannel?: string): Chat {
  const uuid = randomUUID()

  getInstance()
    .prepare('INSERT INTO chats (uuid, name, createdAt, gatewayName, gatewayChannel) VALUES (?, ?, ?, ?, ?)')
    .run(uuid, name, new Date().toISOString(), gatewayName ?? null, gatewayChannel ?? null)

  return getChat(uuid)!
}

export function getChats(): ChatListItem[] {
  return getInstance()
    .prepare<[], ChatListItem>(
      `SELECT chats.*, COUNT(messages.uuid) as messageCount
      FROM chats
      LEFT JOIN messages ON chats.uuid = messages.chatUuid
      GROUP BY chats.uuid
      ORDER BY chats.createdAt ASC`
    )
    .all()
}
