import { AbortableAsyncIterator, ChatResponse } from 'ollama'
import { windowEmitter } from '../window-emitter'

export class ActiveChats {
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

    windowEmitter.emitToAllListeners('llm:chat-state-change', chatUuid, isActive)
  }
}

// Export singleton instance
export const activeChats = new ActiveChats()
