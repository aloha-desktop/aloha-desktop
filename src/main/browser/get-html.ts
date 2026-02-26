import { BrowserWindow } from 'electron'

export async function getHtml(url: string, selector: string = 'body'): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create the browser window.
    const browserWindow = new BrowserWindow({
      width: 900,
      height: 670,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
      },
    })

    browserWindow.webContents.setUserAgent(import.meta.env.MAIN_VITE_USER_AGENT)

    browserWindow.webContents.on('did-finish-load', () => {
      browserWindow.webContents
        .executeJavaScript(`document.querySelector('${selector}')?.outerHTML || ''`, true)
        .then(resolve)
        .then(() => browserWindow.destroy())
        .catch(reject)
    })

    browserWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      const error = new Error(`Failed to load ${url}: ${errorCode} ${errorDescription}`)
      reject(error)
    })

    browserWindow.webContents.setWindowOpenHandler(() => {
      return { action: 'deny' }
    })

    browserWindow.loadURL(url)
  })
}
