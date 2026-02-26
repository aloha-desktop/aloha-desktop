import { Database } from 'better-sqlite3'
import log from 'electron-log'

export type TableInfo = {
  name: string
  type: string
  notnull: number
  dflt_value: string
  pk: number
}

let instance: Database | null = null

export function setInstance(db: Database): void {
  if (instance) {
    log.warn('DB instance already set, resetting...')
    instance.close()
  }

  instance = db
}

export function getInstance(): Database {
  if (!instance) {
    throw new Error('DB instance not initialized')
  }

  return instance
}
