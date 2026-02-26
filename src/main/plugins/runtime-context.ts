import { Logger, PluginContext } from 'aloha-sdk'
import { getHtml } from '../browser/get-html'
import log from 'electron-log'

export class RuntimePluginContext extends PluginContext {
  getLogger(): Logger {
    return log
  }
  renderUrl(url: string): Promise<string> {
    return getHtml(url)
  }
}
