import { getInstance, TableInfo } from './instance'

type DBConfig = {
  namespace: string
  key: string
  value: string
}

const schema: Record<keyof DBConfig, string> = {
  namespace: 'TEXT NOT NULL',
  key: 'TEXT NOT NULL',
  value: 'TEXT NOT NULL',
}

export function prepare(): void {
  const db = getInstance()
  db.prepare('CREATE TABLE IF NOT EXISTS config (namespace TEXT NOT NULL)').run()

  const existingColumns = (db.pragma('table_info(config)') as TableInfo[]).map(({ name }) => name)

  Object.entries(schema).forEach(([name, type]) => {
    if (!existingColumns.includes(name)) {
      db.prepare(`ALTER TABLE config ADD COLUMN ${name} ${type}`).run()
    }
  })

  // Add unique constraint if it doesn't exist
  try {
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS config_namespace_key_unique ON config (namespace, key)').run()
  } catch {
    // Index might already exist, ignore error
  }
}

export function getConfig(namespace: string): DBConfig[] {
  return getInstance().prepare<[string], DBConfig>('SELECT * FROM config WHERE namespace = ?').all(namespace)
}

export function setConfigValue(namespace: string, key: string, value: string): void {
  getInstance()
    .prepare(
      'INSERT INTO config (namespace, key, value) VALUES (?, ?, ?) ON CONFLICT(namespace, key) DO UPDATE SET value = excluded.value'
    )
    .run(namespace, key, value)
}

export function getConfigValue(namespace: string, key: string): string {
  return (
    getInstance()
      .prepare<[string, string], DBConfig>('SELECT value FROM config WHERE namespace = ? AND key = ?')
      .get(namespace, key)?.value ?? ''
  )
}

export function deleteConfigValue(namespace: string, key: string): void {
  getInstance().prepare('DELETE FROM config WHERE namespace = ? AND key = ?').run(namespace, key)
}
