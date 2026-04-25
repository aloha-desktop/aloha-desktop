import { Logger, PluginContext, PathName } from 'aloha-sdk'
import { getHtml } from '../browser/get-html'
import log from 'electron-log'
import { app } from 'electron'

export class RuntimePluginContext extends PluginContext {
  getLogger(): Logger {
    return log
  }
  renderUrl(url: string): Promise<string> {
    return getHtml(url)
  }
  getPath(name: PathName): string {
    return app.getPath(name)
  }
}
