import { AbortableAsyncIterator, ChatResponse } from 'ollama'
import { BrowserWindow } from 'electron'
import { WindowEmitter } from '../window-emitter'

export class ActiveChats extends WindowEmitter {
  private readonly map = new Map<string, AbortableAsyncIterator<ChatResponse>>()

  public add(chatUuid: string, stream: AbortableAsyncIterator<ChatResponse>): void {
    this.map.set(chatUuid, stream)
    this.emitStateChange(chatUuid)
  }

  public get(chatUuid: string): AbortableAsyncIterator<ChatResponse> | undefined {
    return this.map.get(chatUuid)
  }

  public remove(chatUuid: string): void {
    this.map.delete(chatUuid)
    this.emitStateChange(chatUuid)
  }

  public has(chatUuid: string): boolean {
    return this.map.has(chatUuid)
  }

  private emitStateChange(chatUuid: string): void {
    const isActive = this.has(chatUuid)

    this.emitToAllWindows('llm:chat-state-change', chatUuid, isActive)
  }
}

// Export singleton instance
export const activeChats = new ActiveChats()

export function useActiveChats(browserWindow: BrowserWindow): void {
  // Register this window to receive chat state updates
  activeChats.registerWindow(browserWindow)
}
