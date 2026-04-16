import { ipcMain } from 'electron'
import { WhatsAppGateway, WHATSAPP_GATEWAY_NAME } from './whatsapp'
import { getGateway, setGateway } from './get-set-gateway'
import { Gateway } from 'src/main/gateway/gateway'
import log from 'electron-log'

const SUPPORTED_GATEWAYS = {
  [WHATSAPP_GATEWAY_NAME]: WhatsAppGateway,
}

let gatewayInstance: Gateway | null = null

export function useGateway(): void {
  ipcMain.handle('gateway:get-supported-gateways', () => Object.keys(SUPPORTED_GATEWAYS))
  ipcMain.handle('gateway:register', (_event, gatewayName: string) => registerGateway(gatewayName))
  ipcMain.handle('gateway:get-current', () => getGateway())
  ipcMain.handle('gateway:initialize', () => initializeGateway())
  ipcMain.handle('gateway:deregister', () => deregisterGateway())
  ipcMain.handle('gateway:get-pairing-code', () => gatewayInstance?.getPairingCode() || '')
  ipcMain.handle('gateway:get-status', () => gatewayInstance?.getStatus() || '')
}

export async function initializeGateway(): Promise<void> {
  const gatewayName = await getGateway()
  if (!gatewayName) {
    return
  }

  if (!SUPPORTED_GATEWAYS[gatewayName]) {
    throw new Error(`Gateway ${gatewayName} not supported`)
  }

  try {
    gatewayInstance = new SUPPORTED_GATEWAYS[gatewayName]()
    await gatewayInstance?.initialize()
  } catch (err) {
    log.error(`Failed to initialized gateway: ${gatewayName}`, err)
    throw err
  }
}

export async function registerGateway(gatewayName: string): Promise<void> {
  if (!SUPPORTED_GATEWAYS[gatewayName]) {
    throw new Error(`Gateway ${gatewayName} not supported`)
  }
  setGateway(gatewayName)
}

export async function deregisterGateway(): Promise<void> {
  await gatewayInstance?.destroy()
  await setGateway('')
  gatewayInstance = null
}

export function getGatewayInstance(): Gateway | null {
  return gatewayInstance
}
