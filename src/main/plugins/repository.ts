import { app, shell } from 'electron'
import { join } from 'node:path'
import type { Plugin, PluginContext } from 'aloha-sdk'
import { access, constants, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { disable, enable, isEnabled, getEnabled } from '../storage/plugin-crud'
import { RuntimePluginContext } from './runtime-context'
import { ToolCall } from 'ollama'
import { getLatestRelease } from '../github/get-latest-release'
import { extract } from 'tar/extract'
import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'
import mime from 'mime-types'
import log from 'electron-log'

type PluginClass = new (context: PluginContext) => Plugin

let importNonce = Date.now()

const clearImportCache = (): void => {
  importNonce = Date.now()
}

const importPluginClass = (path: string): Promise<{ default: PluginClass }> =>
  import(/* @vite-ignore */ `file://${path}?nonce=${importNonce}`)

export const SUPPORTED_ICON_TYPES = [
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/ico',
  'image/x-icon',
  'image/bmp',
  'image/tiff',
]

const MAX_ICON_SIZE_BYTES = 10 * 1024 // 10kB

export interface ToolManifest {
  type: string
  function: {
    name?: string
    displayName?: string // extra field comparing to ollama's Tool type
    description?: string
    type?: string // not available in Manifest, filled in by updateTools()
    parameters?: {
      type?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $defs?: any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items?: any
      required?: string[]
      properties?: {
        [key: string]: {
          type?: string | string[]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items?: any
          description?: string
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          enum?: any[]
        }
      }
    }
  }
}

export class PluginRepository {
  loadedPlugins: Map<string, Plugin>
  pluginIcons: Map<string, string>
  toolsMap: Record<string, string>
  toolsManifest: ToolManifest[]

  constructor() {
    this.loadedPlugins = new Map<string, Plugin>()
    this.pluginIcons = new Map<string, string>()
    this.toolsMap = {}
    this.toolsManifest = []
  }

  async availablePlugins(): Promise<string[]> {
    await this.ensurePluginsPath()
    const plugins = await readdir(this.pluginsPath(), { withFileTypes: true })

    return plugins
      .filter((plugin) => plugin.isDirectory() && plugin.name.startsWith('aloha-'))
      .map((plugin) => plugin.name)
  }

  async remotePlugins(): Promise<object[]> {
    const response = await fetch(
      'https://raw.githubusercontent.com/aloha-desktop/aloha-desktop/refs/heads/main/plugins.json'
    )
    return await response.json()
  }

  async ensurePluginsPath(): Promise<void> {
    const pluginsPath = this.pluginsPath()
    try {
      await access(pluginsPath, constants.R_OK)
    } catch {
      log.warn(`Plugins path ${pluginsPath} does not exist, creating...`)
      await mkdir(pluginsPath, { recursive: true })
    }
    const pluginsPathStats = await stat(pluginsPath)

    if (!pluginsPathStats.isDirectory()) {
      throw new Error(`Plugins path ${pluginsPath} is not a directory`)
    }
  }

  pluginsPath(): string {
    const userDataPath = app.getPath('userData')
    return join(userDataPath, './plugins')
  }

  async getPluginInfo(plugin: string): Promise<Record<string, unknown>> {
    const pluginPath = join(this.pluginsPath(), plugin)

    try {
      await access(pluginPath, constants.R_OK)
    } catch {
      throw new Error(`Plugin directory ${plugin} is not accessible`)
    }

    try {
      const pluginStats = await stat(pluginPath)

      if (!pluginStats.isDirectory()) {
        throw new Error(`Plugin directory ${pluginPath} is not a directory`)
      }
    } catch (error) {
      throw new Error(`Error getting plugin info for ${plugin}: ${error}`)
    }

    const manifestPath = join(pluginPath, 'manifest.json')
    try {
      await access(manifestPath, constants.R_OK)
    } catch {
      throw new Error(`Plugin manifest does not exist`)
    }

    try {
      const manifestStats = await stat(manifestPath)

      if (!manifestStats.isFile()) {
        throw new Error(`Plugin manifest ${manifestPath} is not a file`)
      }

      const manifestContents = await readFile(manifestPath, { encoding: 'utf8' })
      const manifest = JSON.parse(manifestContents)

      if (!manifest.main) {
        throw new Error(`Plugin manifest ${manifestPath} does not have "main" entry point`)
      }

      return {
        ...manifest,
        pluginPath,
        directory: plugin,
        main: join(pluginPath, manifest.main),
        enabled: isEnabled(plugin),
        loaded: this.isLoaded(plugin),
        installed: !!manifest.main,
      }
    } catch (error) {
      throw new Error(`Error getting plugin info for ${plugin}: ${error}`)
    }
  }

  async callTool(toolCall: ToolCall): Promise<string> {
    const functionName = toolCall.function.name
    const functionArgs = toolCall.function.arguments

    if (!this.toolsMap[functionName]) {
      throw new Error(`Function ${functionName} is not available`)
    }

    const pluginName = this.toolsMap[functionName]
    const plugin = this.loadedPlugins.get(pluginName)

    if (!plugin) {
      throw new Error(`Plugin ${pluginName} is not loaded`)
    }

    if (!plugin.toolCall) {
      throw new Error(`Plugin ${pluginName} does not have a toolCall method`)
    }

    return plugin.toolCall(functionName, functionArgs)
  }

  async updateTools(): Promise<void> {
    const toolsMap: Record<string, string> = {}
    const toolsManifest: ToolManifest[] = []

    for (const pluginName of this.loadedPlugins.keys()) {
      try {
        const pluginInfo = await this.getPluginInfo(pluginName)
        const tools = pluginInfo.tools

        if (!tools || !Array.isArray(tools)) {
          continue
        }

        for (const tool of tools) {
          if (!tool?.name) {
            log.warn(`Plugin ${pluginName} has a tool with no name: ${JSON.stringify(tool)}`)
            continue
          }

          if (toolsMap[tool.name]) {
            log.warn(
              `Plugin ${pluginName} has a ${tool.name} tool conflicting with the another plugin: ${toolsMap[tool.name]}`
            )
            continue
          }

          toolsMap[tool.name] = pluginName
          toolsManifest.push({
            type: 'function',
            function: tool,
          })
        }
      } catch (error) {
        log.error(`Error updating tools for ${pluginName}: ${error}`)
      }
    }

    this.toolsMap = toolsMap
    this.toolsManifest = toolsManifest
  }

  async enablePlugin(plugin: string): Promise<void> {
    if (!plugin) {
      throw new Error('Plugin name is required')
    }

    if (isEnabled(plugin)) {
      throw new Error(`Plugin ${plugin} is already enabled`)
    }

    enable(plugin)
    clearImportCache()
    await this.loadPlugin(plugin)
    await this.updateTools()
  }

  async disablePlugin(plugin: string): Promise<void> {
    if (!plugin) {
      throw new Error('Plugin name is required')
    }

    this.unloadPlugin(plugin)
    disable(plugin)
    await this.updateTools()
  }

  async loadEnabledPlugins(): Promise<void> {
    const enabledPlugins = getEnabled()
    const availablePlugins = await this.availablePlugins()
    const availablePluginDirectories = new Set(availablePlugins)
    const pluginsToLoad = enabledPlugins.filter((plugin) => availablePluginDirectories.has(plugin.directory))

    for (const plugin of pluginsToLoad) {
      await this.loadPlugin(plugin.directory)
    }

    await this.updateTools()
  }

  async loadPlugin(plugin: string): Promise<void> {
    try {
      const pluginInfo = await this.getPluginInfo(plugin)
      const pluginInstance = await this.requirePlugin(pluginInfo)
      this.loadedPlugins.set(plugin, pluginInstance)

      const pluginIcon = await this.fetchPluginIcon(pluginInfo)
      this.pluginIcons.set(plugin, pluginIcon)
    } catch (error) {
      log.error(`Error loading plugin ${plugin}`, error)
    }
  }

  async removePlugin(plugin: string): Promise<void> {
    await this.disablePlugin(plugin)

    const pluginPath = join(this.pluginsPath(), plugin)
    await rm(pluginPath, { recursive: true })
  }

  unloadPlugin(plugin: string): void {
    this.loadedPlugins.delete(plugin)
    this.pluginIcons.delete(plugin)
  }

  isLoaded(plugin: string): boolean {
    return this.loadedPlugins.has(plugin)
  }

  async installPlugin(repo: string): Promise<void> {
    const [username, repoName] = repo.split('/')

    const pluginPath = join(this.pluginsPath(), repoName)

    await mkdir(pluginPath, { recursive: true })

    const latestRelease = await getLatestRelease(username, repoName) // may throw

    const manifestUrl = latestRelease.assets.find(
      (asset) => asset.name === 'manifest.json' && asset.content_type === 'application/json'
    )?.browser_download_url

    const archiveUrl = latestRelease.assets.find(
      (asset) => asset.name === 'plugin.tgz' && asset.content_type === 'application/octet-stream'
    )?.browser_download_url

    if (!manifestUrl) {
      throw new Error('No plugin manifest found in the latest release or the manifest is not a JSON file')
    }

    if (!archiveUrl) {
      throw new Error('No plugin archive found in the latest release or the archive is not a tar.gz file')
    }

    const manifestResponse = await fetch(manifestUrl)
    const manifest = await manifestResponse.json()
    const archiveResponse = await fetch(archiveUrl)

    if (!archiveResponse.body) {
      throw new Error('The plugin archive is empty.')
    }

    if (!manifest.main) {
      throw new Error('The plugin manifest does not have a main entry point')
    }

    await finished(
      Readable.from(archiveResponse.body).pipe(
        extract({
          cwd: pluginPath,
        })
      )
    )

    await writeFile(join(pluginPath, 'manifest.json'), JSON.stringify(manifest, null, 2))

    await this.enablePlugin(repoName)
  }

  async requirePlugin(pluginInfo: Record<string, unknown>): Promise<Plugin> {
    const pluginImport = await importPluginClass(pluginInfo.main as string)

    if (!pluginImport?.default) {
      throw new Error(`Plugin ${pluginInfo.name} does not have a default export`)
    }

    return new pluginImport.default(new RuntimePluginContext())
  }

  async openFolder(): Promise<void> {
    await shell.openPath(this.pluginsPath())
  }

  async getToolIcon(toolName: string): Promise<string> {
    const plugin = this.toolsMap[toolName]
    return this.pluginIcons.get(plugin) || ''
  }

  async fetchPluginIcon(pluginInfo: Record<string, unknown>): Promise<string> {
    const iconPath = pluginInfo.icon as string
    const pluginPath = pluginInfo.pluginPath as string

    if (!iconPath || !pluginPath) {
      return ''
    }

    const fullIconPath = join(pluginPath, iconPath)

    try {
      // Check if file exists
      await access(fullIconPath, constants.R_OK)

      // Get file stats to check size
      const fileStats = await stat(fullIconPath)

      if (fileStats.size > MAX_ICON_SIZE_BYTES) {
        log.warn(`Plugin icon ${iconPath} is too large (${fileStats.size} bytes), skipping`)
        return ''
      }

      // Check MIME type
      const mimeType = mime.lookup(fullIconPath)

      if (!mimeType || !SUPPORTED_ICON_TYPES.includes(mimeType)) {
        log.warn(`Plugin icon ${iconPath} has unsupported MIME type: ${mimeType}, skipping`)
        return ''
      }

      // Read file and return as data URL
      const fileBuffer = await readFile(fullIconPath)
      const base64Data = fileBuffer.toString('base64')
      return `data:${mimeType};base64,${base64Data}`
    } catch (error) {
      log.warn(`Error loading plugin icon ${iconPath}: ${error}`)
      return ''
    }
  }
}

export default new PluginRepository()
