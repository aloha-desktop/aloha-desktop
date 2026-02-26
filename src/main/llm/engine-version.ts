import log from 'electron-log'

export async function engineVersion(): Promise<string> {
  try {
    const liveVersion = await fetch('http://localhost:11434/api/version').then((res) => res.json())
    return liveVersion.version || ''
  } catch (error) {
    log.error('Failed to get engine version', error)
    return ''
  }
}
