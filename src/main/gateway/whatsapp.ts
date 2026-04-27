import { createChat } from '../llm/create-chat'
import { createMessage } from '../llm/create-message'
import { chatRun } from '../llm/chat-run'
import { findChatByGatewayAndChannel } from '../llm/find-chat-by-gateway'
import { Gateway } from './gateway'
import NodeCache from '@cacheable/node-cache'
import os from 'os'
import fs from 'fs/promises'
import { windowEmitter } from '../window-emitter'
import {
  WASocket,
  Browsers,
  CacheStore,
  DisconnectReason,
  useMultiFileAuthState,
  WAMessageKey,
  fetchLatestBaileysVersion,
  WAMessage,
} from 'baileys'
import log from 'electron-log'
import { ToolCall } from 'ollama/dist/index.cjs'
import { ChatMessage } from '@common/types/chat-message'
import { getChat } from '../storage/chat-crud'
import path from 'path'
import { app } from 'electron'

export const WHATSAPP_GATEWAY_NAME = 'whatsapp'
const REINITIALIZE_TIMOUT = 15000 // 15 seconds

export class WhatsAppGateway extends Gateway {
  private sock?: WASocket
  private groupId?: string
  private qrCode?: string = ''
  private status?: string
  private computerName: string = os.hostname()
  private authStatePath = path.join(app.getPath('userData'), 'whatsapp-auth-state')

  // external map to store retry counts of messages when decryption/encryption fails
  // keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
  private msgRetryCounterCache: CacheStore = new NodeCache() as CacheStore

  async initialize(): Promise<void> {
    if (this.status === 'connected') {
      return
    }
    const { default: makeWASocket } = await import('baileys')
    const { state, saveCreds } = await useMultiFileAuthState(this.authStatePath)

    const { version, error, isLatest } = await fetchLatestBaileysVersion()
    log.debug('[WhatsAppGateway] ', version, isLatest, error)

    const groupName = `${this.computerName} (Aloha)`

    try {
      this.sock = makeWASocket({
        version,
        browser: Browsers.appropriate('Chrome'),
        msgRetryCounterCache: this.msgRetryCounterCache,
        auth: state,
        getMessage: async function getMessage(key: WAMessageKey) {
          log.debug('[WhatsAppGateway] getMessage not implemented!', key)
          return undefined
        },
      })
    } catch (err) {
      log.error('[WhatsAppGateway] Unexpected socket error, reconnecting.', err)
      await new Promise((resolve) => setTimeout(resolve, REINITIALIZE_TIMOUT))
      return this.initialize()
    }

    this.sock.ev.process(
      // events is a map for event name => event data
      async (events) => {
        // something about the connection changed
        // maybe it closed, or we received all offline message or connection opened
        if (events['connection.update']) {
          const { connection, lastDisconnect, qr } = events['connection.update']

          if (connection === 'close') {
            // reconnect if not logged out
            const error = lastDisconnect?.error
            const errorCode: number = error && 'output' in error ? error.output.statusCode : 0
            if (errorCode === DisconnectReason.loggedOut) {
              this.status = 'closed'
              log.info('[WhatsAppGateway] Connection closed. You are logged out.')
              this.destroy()
            } else if (errorCode === DisconnectReason.restartRequired) {
              this.status = 'closed'
              log.info('[WhatsAppGateway] Connection closed. Restart required.')
              this.initialize()
            } else {
              this.status = error?.message
              await new Promise((resolve) => setTimeout(resolve, REINITIALIZE_TIMOUT))
              this.initialize()
            }
          } else if (connection === 'open') {
            const groups = await this.sock!.groupFetchAllParticipating()
            const existingGroup = Object.values(groups).find((g) => g.subject === groupName)

            if (!existingGroup) {
              const newGroup = await this.sock!.groupCreate(groupName, [])
              await this.sock!.sendMessage(newGroup.id, {
                text: `Welcome to Aloha Desktop! You can chat with your "${this.computerName}" computer from here.`,
              })
              this.groupId = newGroup.id
              // set group icon
              const iconPath = app.isPackaged
                ? path.join(process.resourcesPath, 'icon-white.png')
                : path.join(app.getAppPath(), 'resources', 'icon-white.png')
              try {
                await this.sock!.updateProfilePicture(this.groupId, { url: iconPath })
              } catch (err) {
                log.error(`[WhatsAppGateway] Failed to set profile picture for main group chat.`, err)
              }
            } else {
              this.groupId = existingGroup.id
            }

            this.status = 'connected'
          } else {
            this.status = connection
          }

          windowEmitter.emitToAllListeners('gateway:status', this.status)

          // Pairing code
          if (qr) {
            this.qrCode = qr
            windowEmitter.emitToAllListeners('gateway:pairing-code', WHATSAPP_GATEWAY_NAME, 'qr', this.qrCode)
          }
        }

        // credentials updated -- save them
        if (events['creds.update']) {
          await saveCreds()
          log.debug('[WhatsAppGateway] Credentials have been updated')
        }

        // received a new message
        if (events['messages.upsert']) {
          const upsert = events['messages.upsert']

          // type append are messages that it has seen already
          if (upsert.type === 'notify') {
            for (const msg of upsert.messages) {
              if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
                if (msg.key.fromMe && msg.key.remoteJid && msg.key.remoteJid === this.groupId) {
                  await this.startNewThread(msg)
                } else {
                  await this.replyInThread(msg)
                }
              }
            }
          }
        }
      }
    )

    // listen to events from the chat runner, we'll get them in send method
    windowEmitter.registerGateway(this)
  }

  extractEmoji(title: string): { emoji: string | null; title: string } {
    const emojiRegex = /\p{Extended_Pictographic}(?:\u200D\p{Extended_Pictographic})*/u
    const match = title.match(emojiRegex)
    if (match) {
      return { emoji: match[0], title: title.replace(match[0], '').trim() }
    }
    return { emoji: null, title }
  }

  emojiURL(emoji: string): string {
    const codePoints = Array.from(emoji)
      .map((ch) => ch.codePointAt(0)!.toString(16))
      .filter((cp) => !['fe0f', 'fe0e'].includes(cp))
    const fileName = `emoji_u${codePoints.join('_')}.svg`
    return `https://raw.githubusercontent.com/googlefonts/noto-emoji/refs/heads/main/svg/${fileName}`
  }

  async destroy(): Promise<void> {
    this.sock?.logout()
    this.sock = undefined
    this.groupId = undefined
    this.qrCode = undefined
    windowEmitter.emitToAllListeners('gateway:status', this.status)
    windowEmitter.emitToAllListeners('gateway:pairing-code', WHATSAPP_GATEWAY_NAME, 'qr', this.qrCode)
    windowEmitter.registerGateway(null)
    await fs.rm(this.authStatePath, { recursive: true, force: true })
  }

  getPairingCode(): string | null {
    return this.qrCode || null
  }

  getStatus(): string | null {
    return this.status || null
  }

  async replyInThread(originalMsg: WAMessage): Promise<void> {
    const text = originalMsg.message?.conversation || originalMsg.message?.extendedTextMessage?.text
    if (!text) {
      return // no text in message
    }
    const gatewayChannel = originalMsg.key.remoteJid!
    const chat = await findChatByGatewayAndChannel(WHATSAPP_GATEWAY_NAME, gatewayChannel)
    if (!chat) {
      return // chat with this channel not found
    }
    await this.sock!.sendMessage(gatewayChannel, { react: { text: '🧠', key: originalMsg.key } })
    await createMessage(text, chat.uuid)
    await chatRun(chat.uuid)
  }

  async startNewThread(originalMsg: WAMessage): Promise<void> {
    const text = originalMsg.message?.conversation || originalMsg.message?.extendedTextMessage?.text

    if (!text) {
      return // no text in message
    }

    // create new group
    const newGroupSubject = `New Chat (${this.computerName})`
    const group = await this.sock!.groupCreate(newGroupSubject, [])
    await this.sock!.groupUpdateDescription(
      group.id,
      `This is a chat thread created by Aloha Desktop on '${this.computerName}' computer.`
    )
    const newChatMsg = await this.sock!.sendMessage(
      group.id, // in new group
      { text }
    )

    // send a message in the device group
    await this.sock!.sendMessage(this.groupId!, { text: '' }, { quoted: newChatMsg })

    // react with thinking to the new message
    await this.sock!.sendMessage(group.id, { react: { text: '🧠', key: newChatMsg?.key } })

    const chat = await createChat(text!, WHATSAPP_GATEWAY_NAME, group.id)
    if (!chat) {
      throw new Error('Failed to create chat')
    }

    await chatRun(chat.uuid)
  }

  async sendMessage(channel: string, ...args: unknown[]): Promise<void> {
    if (channel === 'llm:chat-message') {
      const [msg, contentChunks, , , , doneStreaming] = args as [
        ChatMessage,
        string[], // content chunks
        string[], // thinking chunks
        number | null, // thinking time
        boolean, // new message?
        boolean, // done streaming
        ToolCall[], // tool calls
      ]

      if (doneStreaming) {
        const charUuid = msg.chatUuid
        const chat = getChat(charUuid)
        if (chat && chat.gatewayName === WHATSAPP_GATEWAY_NAME && chat.gatewayChannel) {
          const content = contentChunks.join('')
          if (msg.role === 'tool') {
            // special handling for tool response
            await this.sock!.sendMessage(chat.gatewayChannel, {
              text: `Used ${msg.metadata?.displayName || 'a tool'}`,
            })
          } else if (content) {
            // only non empty content and not tool call reponse
            await this.sock!.sendMessage(chat.gatewayChannel, { text: this.formatMarkdown(content) })
          }
        }
      }
    } else if (channel === 'llm:chat-title') {
      const [chatUuid, titleWithEmoji] = args as [string, string]
      const chat = getChat(chatUuid)
      if (chat && chat.gatewayName === WHATSAPP_GATEWAY_NAME && chat.gatewayChannel) {
        const { title, emoji } = this.extractEmoji(titleWithEmoji)
        await this.sock!.groupUpdateSubject(chat.gatewayChannel, title)

        if (emoji) {
          try {
            await this.sock!.updateProfilePicture(chat.gatewayChannel, { url: this.emojiURL(emoji) })
          } catch (err) {
            log.error(
              `[WhatsAppGateway] Failed to set profile picture for ${chat.gatewayChannel} using emoji ${emoji}`,
              err
            )
          }
        }
      }
    }
  }

  formatMarkdown(content: string): string {
    if (!content) return content
    let result = content

    // Protect triple-backtick code blocks from inline transforms.
    // WhatsApp uses the exact same ``` syntax for monospace blocks.
    const codeBlocks: string[] = []
    result = result.replace(/```[\s\S]*?```/g, (match) => {
      const idx = codeBlocks.push(match) - 1
      return `\x00CB${idx}\x00`
    })

    // Protect inline code from inline transforms.
    // WhatsApp uses the exact same backtick syntax.
    const inlineCodes: string[] = []
    result = result.replace(/`[^`\n]+`/g, (match) => {
      const idx = inlineCodes.push(match) - 1
      return `\x00IC${idx}\x00`
    })

    // Images: keep alt text, discard URL — WA can't render inline MD images
    result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => alt)

    // Links: [text](url) → text (url)
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')

    // Bold + italic (***text*** or ___text___) → *_text_*
    // Must run before the individual bold and italic passes.
    result = result.replace(/\*{3}([^*\n]+?)\*{3}/g, '*_$1_*')
    result = result.replace(/_{3}([^_\n]+?)_{3}/g, '*_$1_*')

    // Italic (*text* with single asterisks) → _text_
    // Lookahead/lookbehind prevents matching the asterisks that are part of **bold**.
    // Must run before bold so that **text** is never misidentified here.
    result = result.replace(/(?<!\*)\*(?!\*)([^*\n]+?)(?<!\*)\*(?!\*)/g, '_$1_')

    // Bold (**text** or __text__) → *text*
    result = result.replace(/\*\*([^*\n]+?)\*\*/g, '*$1*')
    result = result.replace(/__([^_\n]+?)__/g, '*$1*')

    // Strikethrough (~~text~~) → ~text~
    result = result.replace(/~~([^~\n]+?)~~/g, '~$1~')

    // Headings (# through ######) → bold text
    result = result.replace(/^#{1,6}\s+(.+)$/gm, '*$1*')

    // Horizontal rules (--- / *** / ___) → remove entirely
    result = result.replace(/^[-*_]{3,}\s*$/gm, '')

    // Restore inline code and code blocks
    inlineCodes.forEach((code, i) => {
      result = result.replace(`\x00IC${i}\x00`, code)
    })
    codeBlocks.forEach((block, i) => {
      result = result.replace(`\x00CB${i}\x00`, block)
    })

    return result.trim()
  }
}
