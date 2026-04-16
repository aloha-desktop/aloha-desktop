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
  ipcMain.handle('gateway:set-gateway', (_event, gatewayName: string) => {
    if (!SUPPORTED_GATEWAYS[gatewayName]) {
      throw new Error(`Gateway ${gatewayName} not supported`)
    }
    setGateway(gatewayName)
  })
  ipcMain.handle('gateway:get-gateway', () => getGateway())
  ipcMain.handle('gateway:initialize', () => initializeGateway())
  ipcMain.handle('gateway:get-pairing-code', () => gatewayInstance?.getPairingCode())
  ipcMain.handle('gateway:get-status', () => gatewayInstance?.getStatus())
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

export function getGatewayInstance(): Gateway | null {
  return gatewayInstance
}
