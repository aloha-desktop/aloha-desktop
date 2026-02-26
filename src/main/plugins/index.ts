import { ipcMain } from 'electron'
import pluginRepository from './repository'

export async function usePlugins(): Promise<void> {
  ipcMain.handle('plugins:available-plugins', () => pluginRepository.availablePlugins())
  ipcMain.handle('plugins:remote-plugins', () => pluginRepository.remotePlugins())
  ipcMain.handle('plugins:get-plugin-info', (_event, plugin: string) => pluginRepository.getPluginInfo(plugin))
  ipcMain.handle('plugins:enable', (_event, plugin: string) => pluginRepository.enablePlugin(plugin))
  ipcMain.handle('plugins:disable', (_event, plugin: string) => pluginRepository.disablePlugin(plugin))
  ipcMain.handle('plugins:load-enabled-plugins', () => pluginRepository.loadEnabledPlugins())
  ipcMain.handle('plugins:install', (_event, plugin: string) => pluginRepository.installPlugin(plugin))
  ipcMain.handle('plugins:remove', (_event, plugin: string) => pluginRepository.removePlugin(plugin))
  ipcMain.handle('plugins:open-folder', () => pluginRepository.openFolder())
  ipcMain.handle('plugins:get-tool-icon', (_event, toolName: string) => pluginRepository.getToolIcon(toolName))
}
