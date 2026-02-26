import { getConfigValue, setConfigValue } from '../storage/config-crud'

export async function skipWelcome(): Promise<boolean> {
  return getConfigValue('setup', 'skip-welcome') === 'true'
}

export async function setSkipWelcome(isSkipWelcome: boolean): Promise<void> {
  setConfigValue('setup', 'skip-welcome', isSkipWelcome ? 'true' : 'false')
}
