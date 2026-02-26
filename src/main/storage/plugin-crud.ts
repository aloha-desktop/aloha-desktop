import { randomUUID } from 'node:crypto'
import { getInstance, TableInfo } from './instance'

type DBPlugin = {
  uuid: string
  directory: string
}

const schema: Record<keyof DBPlugin, string> = {
  uuid: 'TEXT NOT NULL', // In SQLite, you cannot add a PRIMARY KEY column after the table is created
  directory: 'TEXT',
}

export function prepare(): void {
  const db = getInstance()
  db.prepare('CREATE TABLE IF NOT EXISTS plugins (uuid TEXT PRIMARY KEY NOT NULL)').run()

  const existingColumns = (db.pragma('table_info(plugins)') as TableInfo[]).map(({ name }) => name)

  Object.entries(schema).forEach(([name, type]) => {
    if (!existingColumns.includes(name)) {
      db.prepare(`ALTER TABLE plugins ADD COLUMN ${name} ${type}`).run()
    }
  })
}

export function getEnabled(): DBPlugin[] {
  return getInstance().prepare<[], DBPlugin>('SELECT * FROM plugins').all()
}

export function isEnabled(directory: string): boolean {
  return !!getInstance().prepare<[string], DBPlugin>('SELECT * FROM plugins WHERE directory = ?').get(directory)
}

export function enable(directory: string): void {
  const uuid = randomUUID()

  getInstance().prepare('INSERT INTO plugins (uuid, directory) VALUES (?, ?)').run(uuid, directory)
}

export function disable(directory: string): void {
  getInstance().prepare('DELETE FROM plugins WHERE directory = ?').run(directory)
}
