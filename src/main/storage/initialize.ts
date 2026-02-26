import path from 'path'
import { app } from 'electron'
import { setInstance } from './instance'
import { prepare as prepareChats } from './chat-crud'
import { prepare as prepareMessages } from './messages-crud'
import { prepare as preparePlugins } from './plugin-crud'
import { prepare as prepareConfig } from './config-crud'
import Database from 'better-sqlite3'
import log from 'electron-log'

export function initialize(): void {
  log.info('Initializing DB...')

  const options = process.env.NODE_ENV === 'development' ? { verbose: console.debug.bind(console, 'DB:') } : {}
  const dbPath = path.join(app.getPath('userData'), './aloha.db')

  const db = new Database(dbPath, options)
  setInstance(db)

  db.pragma('journal_mode = WAL')

  prepareChats()
  prepareMessages()
  preparePlugins()
  prepareConfig()

  log.info('DB initialized', dbPath)
}
