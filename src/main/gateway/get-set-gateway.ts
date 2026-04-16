import { getConfigValue, setConfigValue } from '../storage/config-crud'

export async function getGateway(): Promise<string> {
  return getConfigValue('gateway', 'name')
}

export async function setGateway(gateway: string): Promise<void> {
  setConfigValue('gateway', 'name', gateway)
}
